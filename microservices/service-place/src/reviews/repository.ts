import mongoose from 'mongoose';
import { createUUID } from '../core/utils';
import CustomError from '../core/custom-error';
import { ERROR_CODES } from '../consts';
import { IReview, ReviewSchema } from './entities/IReview';
import { ReviewHistorySchema } from './entities/IReviewHistory';

const reviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);
const reviewHistoryModel = mongoose.models.ReviewHistory || mongoose.model('ReviewHistory', ReviewHistorySchema);

export const getReviewsForPlace = async (placeId: string) => {
  const reviewHistory = await reviewHistoryModel.findOne({ placeId });

  let reviews;
  if (!reviewHistory) {
    const now = new Date();

    reviews = await scrapeReviewsForPlace(placeId, now);

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

    const reviewUpdates = getBulkUpdatesForReviews(reviews);

    await reviewModel.collection.bulkWrite(reviewUpdates as any);
  } else {
    reviews = await reviewModel.find({ placeId });
  }

  return { reviews };
};

const getBulkUpdatesForReviews = (reviews: IReview[]) => {
  const updates = [];
  for (const review of reviews) {
    updates.push({
      insertOne: review,
    });
  }
  return updates;
};

export const getReviewHistoryForPlace = async (placeId: string) => {
  const reviewHistory = await reviewHistoryModel.findOne({ placeId });

  if (!reviewHistory) {
    throw new CustomError(ERROR_CODES.REVIEW_HISTORY_NOT_FOUND, `Review history not found for place [${placeId}]`);
  }

  return { reviewHistory };
};

const scrapeReviewsForPlace = (placeId: string, now: Date) => {
  console.log(`Finding reviews for place [${placeId}]`);
  return [
    {
      _id: createUUID(),
      googleId: '0x89b7b783fc58e717:0xde1953f24f51818',
      placeId,
      authorLink: 'https://www.google.com/maps/contrib/112021154772754874803?hl=en-US',
      authorTitle: 'Sharon Stone',
      authorId: '112021154772754874803',
      authorImage: 'https://lh3.googleusercontent.com/a-/AOh14GgesxM1R50ch-ZQfYHkfyCethdfnwVBXlJyzUTHTQ=c0x00000000-cc-rp-ba3',
      reviewText:
        'One of those lesser-known museums. This is a must for visiting DC. The museum is not as crowded as the others But it has an atmosphere like none other. Truly amazed',
      reviewImageUrl: 'https://lh5.googleusercontent.com/p/AF1QipOovYxmn9figwNlbEjNwcretJJpOB1suZ5Mo0lu',
      ownerAnswer: null,
      ownerAnswerTimestamp: null,
      reviewLink:
        'https://www.google.com/maps/reviews/data=!4m5!14m4!1m3!1m2!1s112021154772754874803!2s0x0:0xde1953f24f51818?hl=en-US',
      reviewRating: 5,
      reviewTimestamp: 1612107518,
      reviewDatetimeUtc: '01/31/2021 15:38:38',
      reviewLikes: 0,
      audit: {
        createdDate: now,
        updatedDate: null,
      },
    },
    {
      _id: createUUID(),
      googleId: '0x89b7b783fc58e717:0xde1953f24f51818',
      placeId,
      authorLink: 'https://www.google.com/maps/contrib/115801625784073856553?hl=en-US',
      authorTitle: 'Sara Key',
      authorId: '115801625784073856553',
      authorImage: 'https://lh3.googleusercontent.com/a-/AOh14Ghbg_eItSfbdJ3qfz5Z6TXlXzhMdFWyE-tAHBCsZw=c0x00000000-cc-rp-ba5',
      reviewText:
        'This museum is very historical!!! Brings down history to life regarding the Indians! Extremely interesting if you love history!!! Go with your history class/ students or with friends!!! I really recommend you all going here!! This is the one  places you should visit if you haven’t.',
      reviewImageUrl: 'https://lh3.googleusercontent.com/a-/AOh14Ghbg_eItSfbdJ3qfz5Z6TXlXzhMdFWyE-tAHBCsZw',
      ownerAnswer: null,
      ownerAnswerTimestamp: null,
      reviewLink:
        'https://www.google.com/maps/reviews/data=!4m5!14m4!1m3!1m2!1s115801625784073856553!2s0x0:0xde1953f24f51818?hl=en-US',
      reviewRating: 4,
      reviewTimestamp: 1611894364,
      reviewDatetimeUtc: '01/29/2021 04:26:04',
      reviewLikes: 0,
      audit: {
        createdDate: now,
        updatedDate: null,
      },
    },
  ];
};
