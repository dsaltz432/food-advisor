import mongoose from 'mongoose';
import _ from 'lodash';
import zipcodes from 'zipcodes';
import { AuthorSchema, IAuthor } from './entities/IAuthor';
import { IReview, ReviewSchema, Location } from './entities/IReview';
import { IPlace, PlaceSchema } from '../places/entities/IPlace';
import { AUTHOR_STATUSES, REVIEW_SOURCES } from '../consts';

const authorModel = mongoose.models.Author || mongoose.model('Author', AuthorSchema);
const reviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
const placeModel = mongoose.models.Place || mongoose.model('Place', PlaceSchema);

const distanceThresholdsInMiles = [1, 3, 5, 10, 20];

export const geocodeReviews = async () => {
  let totalPlaceReviewsProcessed = 0;

  // loop through all scraped authors at a time, (as opposed to using a cursor which could time out)
  // TODO: make this work with pulling in batches. For some reason it's not letting me filter out authors without locationStats
  const scrapedAuthors: IAuthor[] = await authorModel.find({ status: AUTHOR_STATUSES.SCRAPED });

  for (const authorsBatch of _.chunk(scrapedAuthors, 100)) {
    // get the place reviews for these authors that don't have location saved already
    const placeReviews: IReview[] = await reviewModel.find({
      authorId: { $in: _.map(authorsBatch, '_id') },
      source: REVIEW_SOURCES.PLACE_SCRAPER,
      location: { $exists: false },
    });
    const placeReviewByAuthor: Record<string, IReview[]> = _.groupBy(placeReviews, 'authorId');

    // get the author reviews for these authors that don't have location saved already
    const authorReviews: IReview[] = await reviewModel.find({
      source: REVIEW_SOURCES.AUTHOR_SCRAPER,
      authorId: { $in: _.uniq(_.map(authorsBatch, '_id')) },
      location: { $exists: false },
      placeAddress: { $ne: '-' }, // if the address is empty, skip it
    });

    const authorReviewsByAuthor: Record<string, IReview[]> = _.groupBy(authorReviews, 'authorId');

    // get the places for these reviews so we can attach the place's location onto each place review
    const places: IPlace[] = await placeModel.find({ _id: { $in: _.uniq(_.map(placeReviews, 'placeId')) } });
    const placesMap: Record<string, IPlace> = _.keyBy(places, '_id');

    const now = new Date();
    let reviewMongoUpdates = [];

    for (const [authorId, placeReviewsForAuthor] of Object.entries(placeReviewByAuthor)) {
      // loop through each of this author's place reviews
      for (const placeReview of placeReviewsForAuthor) {
        const place = placesMap[placeReview.placeId as string];

        const placeReviewLocation = getLocationFromCoords(place.location.lat, place.location.lng);
        if (!placeReviewLocation) {
          // console.log(`Unable to find location for place review [${placeReview._id}], location [${place.location}]`);
          continue;
        }

        // loop through each of the author's review and compute the distance (and stats) for each review compared to each place review
        const locationStatsForPlaceReview = getInitializedAuthorLocationStats();

        const authorReviewsForAuthor = authorReviewsByAuthor[authorId] || [];
        for (const authorReview of authorReviewsForAuthor) {
          // get the detailed location from the author review address
          const address = getCleanedAddress(authorReview.placeAddress);
          const authorReviewLocation = getLocationFromAddress(address);
          if (!authorReviewLocation) {
            continue;
          }

          // queue up the update to set the author review's detailed location. also update with the cleaned address
          reviewMongoUpdates.push({
            updateOne: {
              filter: { _id: authorReview._id },
              update: {
                $set: {
                  location: authorReviewLocation,
                  placeAddress: address,
                  'audit.lastUpdatedLocation': now,
                },
              },
            },
          });

          // calculate the distance from the place to the author review
          const milesFromReviewToPlace = getDistanceBetweenCoords(
            place.location.lat,
            place.location.lng,
            authorReviewLocation.lat,
            authorReviewLocation.lng
          );

          // Count the reviews within each distance threshold
          for (const stats of locationStatsForPlaceReview) {
            if (stats.threshold > milesFromReviewToPlace) {
              stats.numReviewsWithinThreshold++;
              stats.ratingsForThreshold.push(authorReview.rating);
            }
          }
        }

        // Compute averages for each distance threshold
        for (const stats of locationStatsForPlaceReview) {
          if (stats.ratingsForThreshold.length) {
            stats.averageForThreshold = computeAverage(stats.ratingsForThreshold);
            stats.medianForThreshold = computeMedian(stats.ratingsForThreshold);
          }
        }

        // queue up author update with the location stats
        reviewMongoUpdates.push({
          updateOne: {
            filter: { _id: placeReview._id },
            update: {
              $set: {
                location: placeReviewLocation,
                locationStats: locationStatsForPlaceReview,
                'audit.lastUpdatedLocation': now,
              },
            },
          },
        });
      }

      if (reviewMongoUpdates.length >= 1000) {
        await reviewModel.collection.bulkWrite(reviewMongoUpdates);
        totalPlaceReviewsProcessed += reviewMongoUpdates.length;
        console.log(`Derived location for ${totalPlaceReviewsProcessed} place reviews.`);
        reviewMongoUpdates = [];
      }
    }

    if (reviewMongoUpdates.length) {
      await reviewModel.collection.bulkWrite(reviewMongoUpdates);
      totalPlaceReviewsProcessed += reviewMongoUpdates.length;
      console.log(`Derived location ${totalPlaceReviewsProcessed} place reviews. Finished deriving location.`);
      reviewMongoUpdates = [];
    }
  }
};

export const persistLocationStatsOnPlaceReviews = async (authors: IAuthor[]) => {
  let totalPlaceReviewsProcessed = 0;

  for (const authorsBatch of _.chunk(authors, 100)) {
    // get the place reviews for these authors that don't have location saved already
    const placeReviews: IReview[] = await reviewModel.find({
      authorId: { $in: _.map(authorsBatch, '_id') },
      source: REVIEW_SOURCES.PLACE_SCRAPER,
      location: { $exists: false },
    });
    const placeReviewByAuthor: Record<string, IReview[]> = _.groupBy(placeReviews, 'authorId');

    // get the author reviews for these authors. the locations should exist already.
    const authorReviews: IReview[] = await reviewModel.find({
      source: REVIEW_SOURCES.AUTHOR_SCRAPER,
      authorId: { $in: _.uniq(_.map(authorsBatch, '_id')) },
      location: { $exists: true },
    });

    const authorReviewsByAuthor: Record<string, IReview[]> = _.groupBy(authorReviews, 'authorId');

    // get the places for these reviews so we can attach the place's location onto each place review
    const places: IPlace[] = await placeModel.find({ _id: { $in: _.uniq(_.map(placeReviews, 'placeId')) } });
    const placesMap: Record<string, IPlace> = _.keyBy(places, '_id');

    const now = new Date();
    let reviewMongoUpdates = [];

    for (const [authorId, placeReviewsForAuthor] of Object.entries(placeReviewByAuthor)) {
      // loop through each of this author's place reviews
      for (const placeReview of placeReviewsForAuthor) {
        const place = placesMap[placeReview.placeId as string];

        const placeReviewLocation = getLocationFromCoords(place.location.lat, place.location.lng);
        if (!placeReviewLocation) {
          // console.log(`Unable to find location for place review [${placeReview._id}], location [${place.location}]`);
          continue;
        }

        // loop through each of the author's review and compute the distance (and stats) for each review compared to each place review
        const locationStatsForPlaceReview = getInitializedAuthorLocationStats();

        const authorReviewsForAuthor = authorReviewsByAuthor[authorId] || [];
        for (const authorReview of authorReviewsForAuthor) {
          // skip if the author review location isn't found. we can't determine all locations.
          if (!authorReview.location) {
            continue;
          }

          // calculate the distance from the place to the author review
          const milesFromReviewToPlace = getDistanceBetweenCoords(
            place.location.lat,
            place.location.lng,
            authorReview.location.lat,
            authorReview.location.lng
          );

          // Count the reviews within each distance threshold
          for (const stats of locationStatsForPlaceReview) {
            if (stats.threshold > milesFromReviewToPlace) {
              stats.numReviewsWithinThreshold++;
              stats.ratingsForThreshold.push(authorReview.rating);
            }
          }
        }

        // Compute averages for each distance threshold
        for (const stats of locationStatsForPlaceReview) {
          if (stats.ratingsForThreshold.length) {
            stats.averageForThreshold = computeAverage(stats.ratingsForThreshold);
            stats.medianForThreshold = computeMedian(stats.ratingsForThreshold);
          }
        }

        // queue up author update with the location stats
        reviewMongoUpdates.push({
          updateOne: {
            filter: { _id: placeReview._id },
            update: {
              $set: {
                location: placeReviewLocation,
                locationStats: locationStatsForPlaceReview,
                'audit.lastUpdatedLocation': now,
              },
            },
          },
        });
      }

      if (reviewMongoUpdates.length >= 1000) {
        await reviewModel.collection.bulkWrite(reviewMongoUpdates);
        totalPlaceReviewsProcessed += reviewMongoUpdates.length;
        console.log(`Derived location for ${totalPlaceReviewsProcessed} place reviews.`);
        reviewMongoUpdates = [];
      }
    }

    if (reviewMongoUpdates.length) {
      await reviewModel.collection.bulkWrite(reviewMongoUpdates);
      totalPlaceReviewsProcessed += reviewMongoUpdates.length;
      console.log(`Derived location ${totalPlaceReviewsProcessed} place reviews. Finished deriving location.`);
      reviewMongoUpdates = [];
    }
  }
};

export const getLocationFromAddress = (address: string) => {
  if (shouldAddressBeSkipped(address)) {
    // console.log(`Address is being skipped: [${address}]`);
    return null;
  }

  const zip = getZipFromAddress(address);
  if (!zip) {
    // console.log(`Unable to get zip from address [${address}]`);
    return null;
  }

  const authorReviewLocation = getLocationFromZip(zip);
  if (!authorReviewLocation) {
    // console.log(`Unable to find location for author review. address [${address}]`);
    return null;
  }

  return authorReviewLocation;
};

export const getCleanedAddress = (placeAddress: string) => {
  const lastTwoOfAddress = placeAddress.slice(-2);
  if (lastTwoOfAddress === ' -') {
    return placeAddress.slice(0, -2);
  } else {
    return placeAddress;
  }
};

const getZipFromAddress = (address: string) => {
  return address.trim().slice(-5);
};

const shouldAddressBeSkipped = (address: string) => {
  try {
    const lastFiveOfAddress = address.trim().slice(-5);
    const skipIncludesList = [
      'China, ',
      'Russia, ',
      ', Singapore',
      'Ukraine, ',
      ', Taiwan',
      'South Korea, ',
      ', Morocco',
      ', Turkey',
      ', Mexico',
      ', United Kingdom',
      ', Spain',
      ', Israel',
      ', Australia',
      ', Chile',
      ', Malaysia',
      ', India',
      ', Thailand',
      ', Poland',
      ', Colombia',
      ', Puerto Rico',
      ', Canada',
      ', Spain',
      ', France',
      ', Italy',
      ', Australia',
    ];

    if (!isValidUSZip(lastFiveOfAddress)) {
      // if we don't have a 5 digit zip code, we skip it
      return true;
    } else {
      // if the address has any string within the skip list, we skip it
      for (const skipString of skipIncludesList) {
        if (address.includes(skipString)) {
          return true;
        }
      }
    }
    // otherwise we don't skip it
    return false;
  } catch (e) {
    return true;
  }
};

const isValidUSZip = (zip: string) => {
  return /^\d{5}$/.test(zip);
};

export const getLocationFromZip = (zip: string) => {
  const zipMappings: Record<string, string> = {
    '07037': '07097',
    '89518': '89118',
  };

  if (zipMappings[zip]) {
    zip = zipMappings[zip];
  }

  const rawLocation = zipcodes.lookup(zip);
  return getParsedLocation(rawLocation);
};

export const getLocationFromCoords = (lat: number, lng: number) => {
  const rawLocation = zipcodes.lookupByCoords(lat, lng);
  return getParsedLocation(rawLocation);
};

const getParsedLocation = (rawLocation: any) => {
  if (!rawLocation) {
    return null;
  }
  const location: Location = {
    zip: rawLocation.zip,
    lat: rawLocation.latitude,
    lng: rawLocation.longitude,
    city: rawLocation.city,
    state: rawLocation.state,
    country: rawLocation.country,
  };
  return location;
};

const getDistanceBetweenCoords = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  // Returns the great circle distance between two coordinate points in miles
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  lat1 = deg2rad(lat1);
  lat2 = deg2rad(lat2);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 3960 * c;
};

const deg2rad = (value: number) => {
  return value * 0.017453292519943295;
};

const getInitializedAuthorLocationStats = () => {
  type StatsType = {
    threshold: number;
    numReviewsWithinThreshold: number;
    ratingsForThreshold: number[];
    averageForThreshold: number | null;
    medianForThreshold: number | null;
  };

  const authorLocationStats = [];
  for (const threshold of distanceThresholdsInMiles) {
    const stats: StatsType = {
      threshold,
      numReviewsWithinThreshold: 0,
      ratingsForThreshold: [],
      averageForThreshold: null,
      medianForThreshold: null,
    };
    authorLocationStats.push(stats);
  }
  return authorLocationStats;
};

const computeAverage = (array: number[]) => {
  let total = 0;
  for (const num of array) {
    total += num;
  }
  return total / array.length;
};

const computeMedian = (array: number[]) => {
  const sorted = Array.from(array).sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
};
