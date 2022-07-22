import { Schema } from 'mongoose';
import { createUUID } from '../../core/utils';
import { COLLECTIONS } from '../../consts';

export interface IReviewHistory {
  _id: string;
  placeId: string;
  lastPulledAt: Date;
  numReviews: number;
  audit: {
    createdDate: Date;
    updatedDate: Date | null;
  };
}

export const ReviewHistorySchema = new Schema<IReviewHistory>(
  {
    _id: { type: String, default: createUUID },
    placeId: { type: String, required: true },
    lastPulledAt: { type: Date, required: true },
    numReviews: { type: Number, required: true },
    audit: {
      createdDate: { type: Date, required: false, default: () => new Date() },
      updatedDate: { type: Date, required: false, default: null },
    },
  },
  {
    minimize: false,
    collection: COLLECTIONS.REVIEW_HISTORY,
  }
);

ReviewHistorySchema.methods.toJSON = function () {
  const reviewHistory = this.toObject();
  delete reviewHistory.__v;
  return reviewHistory;
};

ReviewHistorySchema.index({ placeId: 1 }, { unique: true });
