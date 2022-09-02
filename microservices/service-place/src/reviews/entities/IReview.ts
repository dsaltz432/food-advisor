import { Schema } from 'mongoose';
import { createUUID } from '../../core/utils';
import { COLLECTIONS, REVIEW_SOURCES } from '../../consts';

export type Location = {
  zip: string;
  lat: number;
  lng: number;
  city: string;
  state: string;
  country: string;
};
export interface IReview {
  _id: string;
  placeId: string | null;
  placeName: string;
  placeAddress: string;
  authorId: string | null;
  googleAuthorId: string;
  authorName: string;
  authorUrl: string;
  authorIsLocalGuide: boolean;
  authorNumReviews: number;
  rating: number;
  timeDescription: string;
  text: string;
  source: REVIEW_SOURCES;
  location?: Location;
  audit: {
    createdDate: Date;
    updatedDate: Date | null;
  };
}

export const ReviewSchema = new Schema<IReview>(
  {
    _id: { type: String, default: createUUID },
    placeId: { type: String, required: true },
    placeName: { type: String, required: true },
    placeAddress: { type: String, required: true },
    authorId: { type: String, required: true },
    googleAuthorId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorUrl: { type: String, required: true },
    authorIsLocalGuide: { type: Boolean, required: true },
    authorNumReviews: { type: Number, required: true },
    rating: { type: Number, required: true },
    timeDescription: { type: String, required: true },
    text: { type: String, required: true },
    source: { type: String, required: true },
    location: {
      zip: { type: String, required: true },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
    },
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
ReviewSchema.index({ authorId: 1 }, { unique: false });
ReviewSchema.index({ source: 1, authorName: 1, authorNumReviews: 1 }, { unique: false });
