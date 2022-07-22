import { Schema } from 'mongoose';
import { createUUID } from '../../core/utils';
import { COLLECTIONS } from '../../consts';

export interface IReview {
  _id: string;
  placeId: string;
  googleId: string;
  authorLink: string;
  authorTitle: string;
  authorId: string;
  authorImage: string;
  reviewText: string;
  reviewImageUrl: string;
  ownerAnswer: string | null;
  ownerAnswerTimestamp: Date | null;
  reviewLink: string;
  reviewRating: number;
  reviewTimestamp: number;
  reviewDatetimeUtc: string;
  reviewLikes: number;
  audit: {
    createdDate: Date;
    updatedDate: Date | null;
  };
}

export const ReviewSchema = new Schema<IReview>(
  {
    _id: { type: String, default: createUUID },
    placeId: { type: String, required: true },
    googleId: { type: String, required: true },
    authorLink: { type: String, required: true },
    authorTitle: { type: String, required: true },
    authorId: { type: String, required: true },
    authorImage: { type: String, required: true },
    reviewText: { type: String, required: true },
    reviewImageUrl: { type: String, required: true },
    ownerAnswer: { type: String, required: false },
    ownerAnswerTimestamp: { type: Date, required: false },
    reviewLink: { type: String, required: true },
    reviewRating: { type: Number, required: true },
    reviewTimestamp: { type: Number, required: true },
    reviewDatetimeUtc: { type: String, required: true },
    reviewLikes: { type: Number, required: true },
    audit: {
      createdDate: { type: Date, required: false, default: () => new Date() },
      updatedDate: { type: Date, required: false, default: null },
    },
  },
  {
    minimize: false,
    collection: COLLECTIONS.REVIEWS,
  }
);

ReviewSchema.methods.toJSON = function () {
  const review = this.toObject();
  delete review.__v;
  return review;
};

ReviewSchema.index({ placeId: 1 }, { unique: false });
