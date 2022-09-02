import { Request, Response } from 'express';
import { HTTP_STATUS_CODES } from '../consts';
import { computeAuthorIdsForPlaceReviews } from './compute-authorIds';
import { geocodeReviews } from './geocode-reviews';
import { processReviewsForPlace, getReviewHistoryForPlace, getReviewsForPlace, testScrapePlace } from './repository';

export const GetReviewsForPlace = async (req: Request, res: Response) => {
  const { placeId } = req.params;

  const reviews = await getReviewsForPlace(placeId);
  res.status(HTTP_STATUS_CODES.OK).json({ reviews });
};

export const ProcessReviewsForPlace = async (req: Request, res: Response) => {
  const { placeId } = req.params;

  await processReviewsForPlace(placeId);
  res.status(HTTP_STATUS_CODES.NO_CONTENT).json();
};

export const GetReviewHistoryForPlace = async (req: Request, res: Response) => {
  const { placeId } = req.params;

  const reviewHistory = await getReviewHistoryForPlace(placeId);
  res.status(HTTP_STATUS_CODES.OK).json({ reviewHistory });
};

export const TestScrapePlace = async (req: Request, res: Response) => {
  const { placeId } = req.query;

  const report = await testScrapePlace(placeId as string);
  res.status(HTTP_STATUS_CODES.OK).json({ report });
};

export const PostProcessReviews = async (_req: Request, res: Response) => {
  await computeAuthorIdsForPlaceReviews();
  await geocodeReviews();
  res.status(HTTP_STATUS_CODES.NO_CONTENT).json();
};
