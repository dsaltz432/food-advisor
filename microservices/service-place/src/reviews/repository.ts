import mongoose from 'mongoose';
import { createUUID, getBulkInsertsForArray } from '../core/utils';
import CustomError from '../core/custom-error';
import { ERROR_CODES } from '../consts';
import { IReview, ReviewSchema } from './entities/IReview';
import { ReviewHistorySchema } from './entities/IReviewHistory';
import { scrapeReviewsForPlace } from './scraper/scrape-reviews';
import { IPlace, PlaceSchema } from '../places/entities/IPlace';

const reviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
const reviewHistoryModel = mongoose.models.ReviewHistory || mongoose.model('ReviewHistory', ReviewHistorySchema);
const placeModel = mongoose.models.Place || mongoose.model('Place', PlaceSchema);

export const getReviewsForPlace = async (placeId: string): Promise<IReview[]> => {
  const reviewHistory = await reviewHistoryModel.findOne({ placeId });

  let reviews: IReview[] = [];
  if (reviewHistory) {
    reviews = await reviewModel.find({ placeId });
  } else {
    const place = await placeModel.findOne({ _id: placeId });
    if (!place) {
      throw new Error(`Place [${placeId}] not found`);
    }
    reviews = await getAndSaveReviewsForPlace(place);
  }

  return reviews;
};

export const getAndSaveReviewsForPlace = async (place: IPlace, headless = true) => {
  const { _id: placeId, googleMapsUrl, userRatingsTotal } = place;

  let reviews: IReview[] = [];
  if (userRatingsTotal > 0) {
    console.log(`Scraping ${userRatingsTotal} reviews for place [${placeId}], googleMapsUrl [${googleMapsUrl}]`);
    reviews = await scrapeReviewsForPlace(placeId, googleMapsUrl, headless);
  }

  const now = new Date();

  await reviewHistoryModel.findOneAndUpdate(
    {
      placeId,
    },
    {
      $set: {
        lastPulledAt: now,
        numReviews: reviews.length,
        'audit.updatedDate': now,
      },
      $setOnInsert: {
        _id: createUUID(),
        placeId,
        'audit.createdDate': now,
      },
    },
    { upsert: true }
  );

  if (reviews.length) {
    await reviewModel.collection.deleteMany({ placeId });
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

  return reviewHistory;
};

export const testScrapePlace = async (placeId: string, headless: boolean) => {
  const report: Record<string, unknown> = {};

  const place = await placeModel.findOne({ _id: placeId });
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

  const reviews = await getAndSaveReviewsForPlace(place, headless);

  const elapsedTime = new Date().getTime() - startTime;

  report.numScrapedReviews = reviews.length;
  report.elapsedTime = elapsedTime;

  return report;
};
