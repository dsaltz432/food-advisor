import mongoose from 'mongoose';
import pMap from 'p-map';
import _ from 'lodash';
import { AuthorSchema, IAuthor } from './entities/IAuthor';
import { IReview, ReviewSchema } from './entities/IReview';
import { IReviewHistory, ReviewHistorySchema } from './entities/IReviewHistory';
import { IPlace, PlaceSchema } from '../places/entities/IPlace';
import { scrapeReviewsForAuthor, scrapeReviewsForPlace } from './scraper/scrape-reviews';
import { createUUID, getBulkInsertsForArray } from '../core/utils';
import { AUTHOR_STATUSES } from '../consts';

const authorModel = mongoose.models.Author || mongoose.model('Author', AuthorSchema);
const reviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
const reviewHistoryModel = mongoose.models.ReviewHistory || mongoose.model('ReviewHistory', ReviewHistorySchema);
const placeModel = mongoose.models.Place || mongoose.model('Place', PlaceSchema);

type PlaceAndReviewHistory = {
  place: IPlace;
  reviewHistory: IReviewHistory | null;
};

export const processReviewsInBulk = async (placeIds: string[]) => {
  // scrapes place reviews for these placeIds and saves those in the DB
  // creates pending authors from those reviews and saves those in the DB
  await processAllPlaceReviews(placeIds);

  // finds all pending authors and scrapes their reviews, updates the authors and reviews in the DB
  await processPendingAuthorReviews();
};

const processAllPlaceReviews = async (placeIds: string[]) => {
  const reviewHistories = await reviewHistoryModel.find({ placeId: { $in: placeIds } });
  const reviewHistoryMap = _.keyBy(reviewHistories, 'placeId');
  const places: IPlace[] = await placeModel.find({ _id: { $in: placeIds } });

  const placeAndReviewHistories: PlaceAndReviewHistory[] = [];
  for (const place of places) {
    placeAndReviewHistories.push({
      place,
      reviewHistory: reviewHistoryMap[place._id],
    });
  }

  await pMap(placeAndReviewHistories, processPlaceReviews, { concurrency: 5 });
};

const processPendingAuthorReviews = async () => {
  // for each author in scope, scrape the reviews for those authors, and save the updated authors and new reviews in the DB
  let totalReviewsProcessed = 0;
  let totalAuthorsProcessed = 0;
  let authorsInBatch: IAuthor[] = [];
  const skipAuthorIds = ['bad07004-faa8-4629-b7f2-9cde8fc10eb6'];

  // loop through 20 authors at a time, to avoid the cursor timing out
  let pendingAuthors: IAuthor[] = await authorModel.find({ status: AUTHOR_STATUSES.PENDING }).limit(20);

  while (pendingAuthors.length) {
    for (const author of pendingAuthors) {
      if (skipAuthorIds.includes(author._id)) {
        // TODO: these authors have parsing issues that need further investigation
        continue;
      }

      // once we've accumulated enough authors, save them to the DB and accumulate the next batch
      authorsInBatch.push(author);
      if (authorsInBatch.length >= 5) {
        const reviewsResponses = await pMap(authorsInBatch, processAuthorReviews, { concurrency: 5 });
        const authorUpdatesInBatch = [];
        const reviewsInsertArray = [];
        for (const { reviewsForAuthor, author } of reviewsResponses) {
          author.status = AUTHOR_STATUSES.SCRAPED;
          authorUpdatesInBatch.push({
            updateOne: {
              filter: { _id: author._id },
              update: { $set: author },
            },
          });
          reviewsInsertArray.push(...reviewsForAuthor);
        }
        await persistAuthorReviews(reviewsInsertArray, authorUpdatesInBatch, authorsInBatch);
        totalReviewsProcessed += reviewsInsertArray.length;
        totalAuthorsProcessed += authorUpdatesInBatch.length;
        authorsInBatch = [];
        console.log(`Processed ${totalReviewsProcessed} reviews from ${totalAuthorsProcessed} authors.`);
      }
    }

    if (authorsInBatch.length) {
      const reviewsResponses = await pMap(authorsInBatch, processAuthorReviews, { concurrency: 5 });
      const authorUpdatesInBatch = [];
      const reviewsInsertArray = [];
      for (const { reviewsForAuthor, author } of reviewsResponses) {
        author.status = AUTHOR_STATUSES.SCRAPED;
        authorUpdatesInBatch.push({
          updateOne: {
            filter: { _id: author._id },
            update: { $set: author },
          },
        });
        reviewsInsertArray.push(...reviewsForAuthor);
      }
      await persistAuthorReviews(reviewsInsertArray, authorUpdatesInBatch, authorsInBatch);
      totalReviewsProcessed += reviewsInsertArray.length;
      totalAuthorsProcessed += authorUpdatesInBatch.length;
      authorsInBatch = [];
      console.log(
        `Processed ${totalReviewsProcessed} reviews from ${totalAuthorsProcessed} authors. Finished processing.`
      );
    }
    // fetch the next 20 pending authors
    pendingAuthors = await authorModel.find({ status: AUTHOR_STATUSES.PENDING }).limit(20);
  }
};

const processPlaceReviews = async (placeAndReviewHistory: PlaceAndReviewHistory) => {
  const { place, reviewHistory } = placeAndReviewHistory;
  const { _id: placeId, name, googleMapsUrl, userRatingsTotal } = place;

  if (reviewHistory || userRatingsTotal === 0) {
    return;
  }
  console.log(
    `Scraping ${userRatingsTotal} place reviews for [${name}], placeId [${placeId}], googleMapsUrl [${googleMapsUrl}]`
  );
  const response = await scrapeReviewsForPlace(place, googleMapsUrl);

  const authorGoogleIdsSet = new Set();
  for (const review of response.reviews) {
    authorGoogleIdsSet.add(review.googleAuthorId);
  }
  const existingAuthors: IAuthor[] = await authorModel.find({
    authorGoogleId: { $in: Array.from(authorGoogleIdsSet) },
  });
  const existingAuthorsMap: Record<string, IAuthor> = _.keyBy(existingAuthors, 'authorGoogleId');

  const authorStubs: IAuthor[] = [];
  for (const review of response.reviews) {
    const existingAuthor = existingAuthorsMap[review.googleAuthorId];
    if (existingAuthor) {
      if (!review.authorId) {
        // update the review with the existing authorId
        review.authorId = existingAuthor._id;
      }
    } else {
      // create the new author and then update the review with the new authorId
      authorStubs.push(generateNewAuthorStub(review));
    }
  }

  await persistPlaceReviews(placeId, response.reviews, authorStubs);
};

const processAuthorReviews = async (authorStub: IAuthor) => {
  const { _id: authorId, authorUrl, authorName, authorNumReviews = 0 } = authorStub;
  let reviewsForAuthor: IReview[] = [];
  let author: IAuthor = authorStub;
  if (authorNumReviews > 0) {
    console.log(
      `Scraping ${authorNumReviews} author reviews for [${authorName}], authorId [${authorId}], authorUrl [${authorUrl}]`
    );
    const results = await scrapeReviewsForAuthor(authorStub, authorUrl);
    author = results.author;
    reviewsForAuthor = results.reviews;
  }

  return { reviewsForAuthor, author };
};

const generateNewAuthorStub = (review: IReview): IAuthor => {
  return {
    _id: createUUID(),
    googleAuthorId: review.authorUrl.split('https://www.google.com/maps/contrib/')[1].split('/')[0],
    authorName: review.authorName,
    authorUrl: review.authorUrl,
    authorIsLocalGuide: review.authorIsLocalGuide,
    authorNumReviews: review.authorNumReviews,
    authorLevel: null,
    authorPoints: null,
    totalReviews: null,
    totalRatings: null,
    status: AUTHOR_STATUSES.PENDING,
    audit: {
      createdDate: new Date(),
      updatedDate: null,
    },
  };
};

const persistPlaceReviews = async (placeId: string, reviews: IReview[], authors: IAuthor[]) => {
  const now = new Date();

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
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
        { upsert: true, session }
      );

      // clear out any existing reviews
      await reviewModel.collection.deleteMany({ placeId }, { session });

      if (reviews.length) {
        const reviewUpdates = getBulkInsertsForArray(reviews);
        await reviewModel.collection.bulkWrite(reviewUpdates as any, { session });
      }
      if (authors.length) {
        await authorModel.collection.insertMany(authors as any, { session });
      }
    });
  } catch (e) {
    throw new Error(`Error saving reviews for place [${placeId}], ${e}`);
  } finally {
    await session.endSession();
  }
};

const persistAuthorReviews = async (reviewsInsertArray: IReview[], authorUpdates: any[], authorsInBatch: IAuthor[]) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // clear out any existing reviews for these authors
      if (authorsInBatch.length) {
        await reviewModel.collection.deleteMany({ authorId: { $in: _.map(authorsInBatch, '_id') } }, { session });
      }

      if (reviewsInsertArray.length) {
        await reviewModel.collection.insertMany(reviewsInsertArray as any, { session });
      }

      if (authorUpdates.length) {
        await authorModel.collection.bulkWrite(authorUpdates as any, { session });
      }
    });
  } catch (e) {
    throw new Error(`Error saving reviews in persistReviewsAndAuthors()], ${e}`);
  } finally {
    await session.endSession();
  }
};
