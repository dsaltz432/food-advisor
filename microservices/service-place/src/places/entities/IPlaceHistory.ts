import { Schema } from 'mongoose';
import { createUUID } from '../../core/utils';
import { COLLECTIONS } from '../../consts';

export interface IPlaceHistory {
  _id: string;
  placeId: string;
  lastPulledAt: Date;
  numReviews: number;
  audit: {
    createdDate: Date;
    updatedDate: Date | null;
  };
}

export const PlaceHistorySchema = new Schema<IPlaceHistory>(
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
    collection: COLLECTIONS.PLACE_HISTORY,
  }
);

PlaceHistorySchema.methods.toJSON = function () {
  const placeHistory = this.toObject();
  delete placeHistory.__v;
  return placeHistory;
};

PlaceHistorySchema.index({ placeId: 1 }, { unique: true });
