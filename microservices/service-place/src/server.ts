// initialize config as the very first step
import { config } from 'dotenv';
config();

import { getLogger } from './core/logger';
const logger = getLogger('index');

import Database from './core/database';
import mongoose from 'mongoose';
import webapp from './core/webapp';

import { GetPlace, GetPlacesNearby, ProcessPlacesNearby } from './places/endpoints';
import {
  GetReviewsForPlace,
  GetReviewHistoryForPlace,
  ProcessReviewsForPlace,
  TestScrapePlace,
  PostProcessReviews,
} from './reviews/endpoints';

webapp.post('/v1/places/scraper/test', TestScrapePlace);
webapp.get('/v1/places/nearby', GetPlacesNearby);
webapp.post('/v1/places/nearby', ProcessPlacesNearby);
webapp.get('/v1/places/:placeId', GetPlace);
webapp.get('/v1/places/:placeId/reviews', GetReviewsForPlace);
webapp.get('/v1/places/:placeId/reviews/history', GetReviewHistoryForPlace);
webapp.post('/v1/places/:placeId/reviews', ProcessReviewsForPlace);
webapp.post('/v1/places/reviews/post-process', PostProcessReviews);

export const bootstrapService = async () => {
  // connect to mongo
  const db = new Database();
  await db.connect(mongoose.connect);

  // start webapp
  webapp.start();
};

bootstrapService()
  .then(async () => {
    logger.info(`service-place started up using node version ${process.version}`);
  })
  .catch((error) => {
    logger.error(error);
    process.exit(1);
  });
