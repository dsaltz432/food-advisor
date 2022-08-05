import mongoose from 'mongoose';
import _ from 'lodash';
import pMap from 'p-map';
import { ERROR_CODES } from '../consts';
import { computePlaceScores } from './compute-place-scores';
import { fetchPlaceDetailsForPlaceIds, fetchPlacesForType } from './fetch-places-for-type';
import { FOOD_PLACE_TYPES } from './utils';
import CustomError from '../core/custom-error';
import { PlaceHistorySchema } from './entities/IPlaceHistory';
import { IPlace, PlaceSchema } from './entities/IPlace';
import { IRawPlace } from './entities/IRawPlace';
import { createUUID, getBulkInsertsForArray } from '../core/utils';
import { getAndSaveReviewsForPlace } from '../reviews/repository';
import { IReview, ReviewSchema } from '../reviews/entities/IReview';
import { addMetricsForReviews } from './compute-metrics-for-reviews';
import { ReviewHistorySchema } from '../reviews/entities/IReviewHistory';

const placeModel = mongoose.models.Place || mongoose.model('Place', PlaceSchema);
const placeHistoryModel = mongoose.models.ReviewHistory || mongoose.model('PlaceHistory', PlaceHistorySchema);
const reviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
const reviewHistoryModel = mongoose.models.ReviewHistory || mongoose.model('ReviewHistory', ReviewHistorySchema);

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export const getPlace = async (placeId: string) => {
  const place = await placeModel.findOne({ _id: placeId });

  if (!place) {
    throw new CustomError(ERROR_CODES.PLACE_NOT_FOUND, `Place [${placeId}] not found`);
  }

  return { place };
};

export const getPlaceHistory = async (placeId: string) => {
  const placeHistory = await placeHistoryModel.findOne({ placeId });

  if (!placeHistory) {
    throw new CustomError(ERROR_CODES.PLACE_HISTORY_NOT_FOUND, `Place history not found for place [${placeId}]`);
  }

  return { placeHistory };
};

export const getPlacesNearby = async (lat: number, lng: number, radius: number, keyword?: string) => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error(`Must define the GOOGLE_MAPS_API_KEY`);
  }

  const places = await getAndPersistPlaces(lat, lng, radius, keyword);

  const reviewsResponses = await pMap(places, getReviews, { concurrency: 10 });

  const reviewsPerPlaces: Record<string, IReview[]> = {};

  for (const [index, reviews] of reviewsResponses.entries()) {
    const placeId = places[index]._id;
    reviewsPerPlaces[placeId] = reviews;
  }

  addMetricsForReviews(places, reviewsPerPlaces);

  console.log(`Found a total of ${places.length} places`);

  const adjustedPlaces = computePlaceScores(places);
  return { places: adjustedPlaces };
};

const getReviews = async (place: IPlace): Promise<IReview[]> => {
  const placeId = place._id;

  console.time(`scraping:${placeId}`);

  const reviewHistory = await reviewHistoryModel.findOne({ placeId });

  // in the future we can check if the history has been around longer than X and re-pull it
  let reviews;
  if (!reviewHistory) {
    console.log(`Fetching reviews for place [${placeId}]`);
    reviews = await getAndSaveReviewsForPlace(place);
  } else {
    reviews = await reviewModel.find({ placeId });
  }

  console.timeEnd(`scraping:${placeId}`);

  return reviews;
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

  return { foundPlaces, missingRawPlaces };
};

const getPlaceFromRawPlace = (rawPlace: IRawPlace, now: Date, googleMapsUrl: string) => {
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
    userRatingsTotal: rawPlace.user_ratings_total,
    types: rawPlace.types,
    icon: rawPlace.icon,
    scope: rawPlace.scope,
    openingHours: rawPlace.openingHours,
    priceLevel: rawPlace.price_level,
    googleMapsUrl,
    audit: {
      createdDate: now,
      updatedDate: null,
    },
  };
};

const getAndPersistPlaces = async (lat: number, lng: number, radius: number, keyword?: string) => {
  const now = new Date();
  const baseUrl = 'https://maps.googleapis.com/maps/api';
  const basePlaceDetailsUrl = `${baseUrl}/place/details/json?key=${GOOGLE_MAPS_API_KEY}&fields=url`;

  const allRawPlaces = await getRawPlaces(baseUrl, lat, lng, radius, keyword);

  const places: IPlace[] = [];
  const { foundPlaces, missingRawPlaces } = await getPlacesFromMongo(allRawPlaces);
  places.push(...foundPlaces);

  if (missingRawPlaces.length) {
    const missingGooglePlaceIds = _.map(missingRawPlaces, 'place_id');
    const urlToGooglePlaceIdMap = await fetchPlaceDetailsForPlaceIds(missingGooglePlaceIds, basePlaceDetailsUrl);
    for (const rawPlace of missingRawPlaces) {
      const googleMapsUrl = urlToGooglePlaceIdMap[rawPlace.place_id] ?? null;
      places.push(getPlaceFromRawPlace(rawPlace, now, googleMapsUrl));
    }

    const placeUpdates = getBulkInsertsForArray(places);
    await placeModel.collection.bulkWrite(placeUpdates as any);
  }

  return places;
};

const getRawPlaces = async (baseUrl: string, lat: number, lng: number, radius: number, keyword?: string) => {
  const basePlacesUrl = `${baseUrl}/place/nearbysearch/json?key=${GOOGLE_MAPS_API_KEY}`;

  const promises = [];
  for (const type of FOOD_PLACE_TYPES) {
    let urlForLocation = `${basePlacesUrl}&location=${lat},${lng}&radius=${radius}&type=${type}`;
    if (keyword) {
      urlForLocation = `${urlForLocation}&keyword=${keyword}`;
    }
    promises.push(fetchPlacesForType(basePlacesUrl, urlForLocation));
  }
  const responses = await Promise.all(promises);

  // create a Map to de-dupe any repeated places
  const allRawPlacesMap: Record<string, IRawPlace> = {};
  for (const results of responses) {
    for (const result of results) {
      allRawPlacesMap[result.place_id] = result;
    }
  }

  return Object.values(allRawPlacesMap);
};
