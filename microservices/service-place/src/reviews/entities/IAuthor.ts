import { Schema } from 'mongoose';
import { createUUID } from '../../core/utils';
import { AUTHOR_STATUSES, COLLECTIONS } from '../../consts';

export interface IAuthor {
  _id: string;
  googleAuthorId: string;
  authorName: string;
  authorUrl: string;
  authorIsLocalGuide: boolean;
  authorNumReviews: number;
  totalReviews: number | null;
  totalRatings: number | null;
  authorLevel: number | null;
  authorPoints: number | null;
  status: AUTHOR_STATUSES;
  audit: {
    createdDate: Date;
    updatedDate: Date | null;
  };
}

export const AuthorSchema = new Schema<IAuthor>(
  {
    _id: { type: String, default: createUUID },
    googleAuthorId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorUrl: { type: String, required: true },
    authorIsLocalGuide: { type: Boolean, required: true },
    authorNumReviews: { type: Number, required: true },
    totalReviews: { type: Number, required: true },
    totalRatings: { type: Number, required: true },
    authorLevel: { type: Number, required: true },
    authorPoints: { type: Number, required: true },
    status: { type: String, required: true },
    audit: {
      createdDate: { type: Date, required: false, default: () => new Date() },
      updatedDate: { type: Date, required: false, default: null },
    },
  },
  {
    minimize: false,
    collection: COLLECTIONS.AUTHORS,
  }
);

AuthorSchema.methods.toJSON = function () {
  const author = this.toObject();
  delete author.__v;
  return author;
};

AuthorSchema.index({ googleAuthorId: 1 }, { unique: true });
AuthorSchema.index({ status: 1 }, { unique: false });
