import { REVIEW_SOURCES } from '../../consts';

export interface IRawReview {
  placeId: string;
  placeName: string;
  placeAddress: string;
  authorName: string;
  authorUrl: string;
  googleAuthorId: string;
  authorIsLocalGuide: boolean;
  authorNumReviews: number;
  rating: number;
  timeDescription: string;
  text: string;
  source: REVIEW_SOURCES;
}
