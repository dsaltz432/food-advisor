import { Schema } from 'mongoose';
import { createUUID } from '../../core/utils';
import { COLLECTIONS } from '../../consts';

export interface IPlace {
  _id: string;
  googlePlaceId: string;
  googleReference: string;
  businessStatus: string;
  location: {
    lat: number;
    lng: number;
  };
  icon: string;
  name: string;
  openingHours: { openNow: true };
  numPhotos: number;
  priceLevel: number;
  rating: number;
  scope: string;
  types: string[];
  userRatingsTotal: number;
  vicinity: string;
  googleMapsUrl: string;
  // computedMetrics: {
  //   localGuidePercentage: number;
  //   adjustedRating: number;
  // };
  computedMetrics?: any;
  audit: {
    createdDate: Date;
    updatedDate: Date | null;
  };
}
export const PlaceSchema = new Schema<IPlace>(
  {
    _id: { type: String, default: createUUID },
    googlePlaceId: { type: String, required: true },
    googleReference: { type: String, required: true },
    businessStatus: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    icon: { type: String, required: true },
    name: { type: String, required: true },
    openingHours: { openNow: { type: Boolean, required: true } },
    numPhotos: { type: Number, required: true },
    priceLevel: { type: Number, required: true },
    rating: { type: Number, required: true },
    scope: { type: String, required: true },
    types: { type: [String], required: true },
    userRatingsTotal: { type: Number, required: true },
    vicinity: { type: String, required: true },
    googleMapsUrl: { type: String, required: true },
    // computedMetrics: {
    //   localGuidePercentage: { type: Number, required: true },
    //   adjustedRating: { type: Number, required: true },
    // },
    computedMetrics: { type: {}, required: false },
    audit: {
      createdDate: { type: Date, required: false, default: () => new Date() },
      updatedDate: { type: Date, required: false, default: null },
    },
  },
  {
    minimize: false,
    collection: COLLECTIONS.PLACES,
  }
);

PlaceSchema.methods.toJSON = function () {
  const place = this.toObject();
  delete place.__v;
  return place;
};

PlaceSchema.index({ googlePlaceId: 1 }, { unique: true });
