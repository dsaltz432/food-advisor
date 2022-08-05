import mongoose from 'mongoose';
import { createUUID, getBulkInsertsForArray } from '../core/utils';
import CustomError from '../core/custom-error';
import { ERROR_CODES } from '../consts';
import { ReviewSchema } from './entities/IReview';
import { ReviewHistorySchema } from './entities/IReviewHistory';
import { scrapeReviewsForPlace } from './scraper/scrape-reviews';
import { IPlace, PlaceSchema } from '../places/entities/IPlace';

const reviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
const reviewHistoryModel = mongoose.models.ReviewHistory || mongoose.model('ReviewHistory', ReviewHistorySchema);
const placeModel = mongoose.models.Place || mongoose.model('Place', PlaceSchema);

export const getReviewsForPlace = async (placeId: string) => {
  const reviewHistory = await reviewHistoryModel.findOne({ placeId });

  let reviews;
  if (reviewHistory) {
    reviews = await reviewModel.find({ placeId });
  } else {
    const place = await placeModel.findOne({ _id: placeId });
    if (!place) {
      throw new Error(`Place [${placeId}] not found`);
    }
    reviews = await getAndSaveReviewsForPlace(place);
  }

  return { reviews };
};

export const getAndSaveReviewsForPlace = async (place: IPlace) => {
  const { _id: placeId, googleMapsUrl } = place;

  const reviews = await scrapeReviewsForPlace(placeId, googleMapsUrl);

  const now = new Date();

  await reviewHistoryModel.create({
    _id: createUUID(),
    placeId,
    lastPulledAt: now,
    numReviews: reviews.length,
    audit: {
      createdDate: now,
      updatedDate: null,
    },
  });

  if (reviews.length) {
    const reviewUpdates = getBulkInsertsForArray(reviews);
    await reviewModel.collection.bulkWrite(reviewUpdates as any);
  }

  return reviews;
};

export const getReviewHistoryForPlace = async (placeId: string) => {
  const reviewHistory = await reviewHistoryModel.findOne({ placeId });

  if (!reviewHistory) {
    throw new CustomError(ERROR_CODES.REVIEW_HISTORY_NOT_FOUND, `Review history not found for place [${placeId}]`);
  }

  return { reviewHistory };
};
