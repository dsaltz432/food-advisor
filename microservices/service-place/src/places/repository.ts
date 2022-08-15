import mongoose from 'mongoose';
import _ from 'lodash';
import pMap from 'p-map';
import { ERROR_CODES } from '../consts';
import { computePlaceScores } from './compute-place-scores';
import { fetchPlaceDetailsForPlaceIds, getRawPlacesFromGoogle } from '../google';
import CustomError from '../core/custom-error';
import { IPlace, PlaceSchema } from './entities/IPlace';
import { IRawPlace } from './entities/IRawPlace';
import { createUUID, getBulkInsertsForArray } from '../core/utils';
import { getReviewsForPlace } from '../reviews/repository';
import { IReview } from '../reviews/entities/IReview';
import { addMetricsForReviews } from './compute-metrics-for-reviews';

const placeModel = mongoose.models.Place || mongoose.model('Place', PlaceSchema);

export const getPlace = async (placeId: string) => {
  const place: IPlace | null = await placeModel.findOne({ _id: placeId });

  if (!place) {
    throw new CustomError(ERROR_CODES.PLACE_NOT_FOUND, `Place [${placeId}] not found`);
  }

  return place;
};

export const getPlacesNearby = async (lat: number, lng: number, radius: number, keyword?: string) => {
  // const places = await getAndPersistPlaces(lat, lng, radius, keyword);
  // temporarily just assume the DB has what we need
  const places = await placeModel.find();

  const reviewsPerPlace = await getReviewsPerPlaceMap(places);

  addMetricsForReviews(places, reviewsPerPlace);

  console.log(`Found a total of ${places.length} nearby places`);

  return computePlaceScores(places);
};

const getReviewsPerPlaceMap = async (places: IPlace[]) => {
  const placeIds = _.map(places, '_id');

  const reviewsResponses = await pMap(placeIds, getReviewsForPlace, { concurrency: 10 });

  const reviewsPerPlace: Record<string, IReview[]> = {};

  for (const [index, reviews] of reviewsResponses.entries()) {
    const placeId = places[index]._id;
    reviewsPerPlace[placeId] = reviews;
  }

  return reviewsPerPlace;
};

const getAndPersistPlaces = async (lat: number, lng: number, radius: number, keyword?: string) => {
  const allRawPlaces = await getRawPlacesFromGoogle(lat, lng, radius, keyword);

  const places: IPlace[] = [];
  const { foundPlaces, missingRawPlaces } = await getPlacesFromMongo(allRawPlaces);
  places.push(...foundPlaces);

  if (missingRawPlaces.length) {
    const missingGooglePlaceIds = _.map(missingRawPlaces, 'place_id');
    const urlToGooglePlaceIdMap = await fetchPlaceDetailsForPlaceIds(missingGooglePlaceIds);

    const missingPlaces = [];
    for (const rawPlace of missingRawPlaces) {
      const googleMapsUrl = urlToGooglePlaceIdMap[rawPlace.place_id] ?? null;
      missingPlaces.push(getPlaceFromRawPlace(rawPlace, googleMapsUrl));
    }
    places.push(...missingPlaces);

    // save the missing places in mongo
    const placeUpdates = getBulkInsertsForArray(missingPlaces);
    await placeModel.collection.bulkWrite(placeUpdates as any);
  }

  return places;
};

const getPlacesFromMongo = async (allRawPlaces: IRawPlace[]) => {
  const missingRawPlaces: IRawPlace[] = [];
  const foundPlaces: IPlace[] = [];

  const googlePlaceIds = _.map(allRawPlaces, 'place_id');

  const places = await placeModel.find({ googlePlaceId: { $in: googlePlaceIds } });
  const foundPlacesMap = _.keyBy(places, 'googlePlaceId');

  for (const rawPlace of allRawPlaces) {
    const googlePlaceId = rawPlace.place_id;
    const existingPlace = foundPlacesMap[googlePlaceId];
    if (existingPlace) {
      foundPlaces.push(existingPlace);
    } else {
      missingRawPlaces.push(rawPlace);
    }
  }

  console.log(`Found ${foundPlaces.length} places from mongo. missing ${missingRawPlaces.length} places`);
  return { foundPlaces, missingRawPlaces };
};

const getPlaceFromRawPlace = (rawPlace: IRawPlace, googleMapsUrl: string) => {
  return {
    _id: createUUID(),
    googlePlaceId: rawPlace.place_id,
    googleReference: rawPlace.reference,
    businessStatus: rawPlace.business_status,
    name: rawPlace.name,
    location: rawPlace.geometry.location,
    vicinity: rawPlace.vicinity,
    numPhotos: rawPlace.photos?.length ?? 0,
    rating: rawPlace.rating,
    userRatingsTotal: rawPlace.user_ratings_total ?? 0,
    types: rawPlace.types,
    icon: rawPlace.icon,
    scope: rawPlace.scope,
    openingHours: rawPlace.openingHours,
    priceLevel: rawPlace.price_level,
    googleMapsUrl,
    audit: {
      createdDate: new Date(),
      updatedDate: null,
    },
  };
};
