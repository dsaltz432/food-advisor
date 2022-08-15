import { Request, Response } from 'express';
import { HTTP_STATUS_CODES } from '../consts';
import { getReviewHistoryForPlace, getReviewsForPlace, testScrapePlace } from './repository';

export const GetReviewsForPlace = async (req: Request, res: Response) => {
  const { placeId } = req.params;

  const reviews = await getReviewsForPlace(placeId);
  res.status(HTTP_STATUS_CODES.OK).json({ reviews });
};

export const GetReviewHistoryForPlace = async (req: Request, res: Response) => {
  const { placeId } = req.params;

  const reviewHistory = await getReviewHistoryForPlace(placeId);
  res.status(HTTP_STATUS_CODES.OK).json({ reviewHistory });
};

export const TestScrapePlace = async (req: Request, res: Response) => {
  const { placeId, headless: headlessString } = req.query;
  const headless = headlessString === 'true';

  const report = await testScrapePlace(placeId as string, headless);
  res.status(HTTP_STATUS_CODES.OK).json({ report });
};
