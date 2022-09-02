import mongoose from 'mongoose';
import _ from 'lodash';
import CustomError from '../core/custom-error';
import { ERROR_CODES } from '../consts';
import { IReview, ReviewSchema } from './entities/IReview';
import { ReviewHistorySchema } from './entities/IReviewHistory';
import { IPlace, PlaceSchema } from '../places/entities/IPlace';
import { processReviewsInBulk } from './process-reviews-in-bulk';

const reviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
const reviewHistoryModel = mongoose.models.ReviewHistory || mongoose.model('ReviewHistory', ReviewHistorySchema);
const placeModel = mongoose.models.Place || mongoose.model('Place', PlaceSchema);

export const getReviewsForPlace = async (placeId: string): Promise<IReview[]> => {
  return await reviewModel.find({ placeId });
};

export const processReviewsForPlace = async (placeId: string) => {
  await processReviewsInBulk([placeId]);
};

export const processReviewsForPlaces = async (placeIds: string[]) => {
  for (const placeIdsSubset of _.chunk(placeIds, 5)) {
    await processReviewsInBulk(placeIdsSubset);
  }
};

export const getReviewHistoryForPlace = async (placeId: string) => {
  const reviewHistory = await reviewHistoryModel.findOne({ placeId });

  if (!reviewHistory) {
    throw new CustomError(ERROR_CODES.REVIEW_HISTORY_NOT_FOUND, `Review history not found for place [${placeId}]`);
  }

  return reviewHistory;
};

export const testScrapePlace = async (placeId: string) => {
  const report: Record<string, unknown> = {};

  const place: IPlace | null = await placeModel.findOne({ _id: placeId });
  if (!place) {
    throw new Error(`Place [${placeId}] not found`);
  }

  const reviewHistory = await reviewHistoryModel.findOne({ placeId });

  if (reviewHistory) {
    report.alreadyScraped = true;
    const existingReviews = await reviewModel.find({ placeId });
    report.numExistingReviews = existingReviews.length;
  } else {
    report.alreadyScraped = false;
  }

  const startTime = new Date().getTime();

  await processReviewsForPlace(placeId);

  const reviews = await getReviewsForPlace(placeId);

  const elapsedTime = new Date().getTime() - startTime;

  report.numScrapedReviews = reviews.length;
  report.numReviewsOnPlace = place.userRatingsTotal;
  report.elapsedTime = elapsedTime;

  return report;
};
