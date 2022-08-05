import { Schema } from 'mongoose';
import { createUUID } from '../../core/utils';
import { COLLECTIONS } from '../../consts';

export interface IReview {
  _id: string;
  placeId: string;
  authorName: string;
  authorUrl: string;
  authorIsLocalGuide: boolean;
  authorNumReviews: number;
  rating: number;
  timeDescription: string;
  text: string;
  audit: {
    createdDate: Date;
    updatedDate: Date | null;
  };
}

export const ReviewSchema = new Schema<IReview>(
  {
    _id: { type: String, default: createUUID },
    placeId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorUrl: { type: String, required: true },
    authorIsLocalGuide: { type: Boolean, required: true },
    authorNumReviews: { type: Number, required: true },
    rating: { type: Number, required: true },
    timeDescription: { type: String, required: true },
    text: { type: String, required: true },
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
