import mongoose from 'mongoose';
import _ from 'lodash';
import { AuthorSchema, IAuthor } from './entities/IAuthor';
import { IReview, ReviewSchema } from './entities/IReview';
import { REVIEW_SOURCES } from '../consts';

const authorModel = mongoose.models.Author || mongoose.model('Author', AuthorSchema);
const reviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

// computes and persists authorIds for place reviews based on name matching the author reviews which already have the authorId
export const computeAuthorIdsForPlaceReviews = async () => {
  // target all placeReviews that do not have an authorId set yet
  const placeReviewCursor = await reviewModel.find({ source: REVIEW_SOURCES.PLACE_SCRAPER, authorId: null }).cursor();

  const now = new Date();
  let placeReviewsBatch = [];
  let reviewMongoUpdates = [];
  let totalReviewUpdates = 0;

  for await (const placeReview of placeReviewCursor) {
    placeReviewsBatch.push(placeReview);
    if (placeReviewsBatch.length >= 500) {
      const authorIdMap = await findMatchingAuthorIdsMap(placeReviewsBatch);
      for (const placeReviewInBatch of placeReviewsBatch) {
        const authorId = authorIdMap[placeReviewInBatch.googleAuthorId];
        if (authorId) {
          reviewMongoUpdates.push({
            updateOne: {
              filter: { _id: placeReviewInBatch._id },
              update: { $set: { authorId, 'audit.updatedDate': now } },
            },
          });
        } else {
          console.log(
            `Unable to find exactly match for placeReview._id [${placeReviewInBatch._id}], googleAuthorId [${placeReviewInBatch.googleAuthorId}]`
          );
        }
      }
      if (reviewMongoUpdates.length) {
        await reviewModel.collection.bulkWrite(reviewMongoUpdates);
        totalReviewUpdates += reviewMongoUpdates.length;
        reviewMongoUpdates = [];
        console.log(`Computed ${totalReviewUpdates} authorIds.`);
      }
      placeReviewsBatch = [];
    }
  }

  if (placeReviewsBatch.length) {
    const authorIdMap = await findMatchingAuthorIdsMap(placeReviewsBatch);
    for (const placeReviewInBatch of placeReviewsBatch) {
      const authorId = authorIdMap[placeReviewInBatch.googleAuthorId];
      if (authorId) {
        reviewMongoUpdates.push({
          updateOne: {
            filter: { _id: placeReviewInBatch._id },
            update: { $set: { authorId, 'audit.updatedDate': now } },
          },
        });
      } else {
        console.log(
          `Unable to find exactly match for placeReview._id [${placeReviewInBatch._id}], googleAuthorId [${placeReviewInBatch.googleAuthorId}]`
        );
      }
    }
    if (reviewMongoUpdates.length) {
      await reviewModel.collection.bulkWrite(reviewMongoUpdates);
      totalReviewUpdates += reviewMongoUpdates.length;
      reviewMongoUpdates = [];
      console.log(`Computed ${totalReviewUpdates} authorIds. Finished.`);
    }
    placeReviewsBatch = [];
  }
};

const findMatchingAuthorIdsMap = async (placeReviewsBatch: IReview[]) => {
  const authorIdMap: Record<string, string> = {};
  const googleAuthorIds = _.uniq(_.map(placeReviewsBatch, 'googleAuthorId'));
  const authors: IAuthor[] = await authorModel.find({ googleAuthorId: { $in: googleAuthorIds } });
  for (const author of authors) {
    authorIdMap[author.googleAuthorId] = author._id;
  }
  return authorIdMap;
};
