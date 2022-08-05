import _ from 'lodash';
import { IReview } from '../reviews/entities/IReview';
import { IPlace } from './entities/IPlace';

export const addMetricsForReviews = (places: IPlace[], reviewsPerPlaces: Record<string, IReview[]>) => {
  // compute fields based on reviews
  for (const place of places) {
    const reviews = reviewsPerPlaces[place._id] ?? [];
    _.set(place, 'computedMetrics.localGuidePercentage', getPercentageIsLocalGuide(reviews));
  }

  // compute percentile statistics compared to all the other places
  const localGuidePercentagesForPlaces = _.map(places, 'computedMetrics.localGuidePercentage');
  const userRatingsTotalsForPlaces = _.map(places, 'userRatingsTotal');

  for (const place of places) {
    _.set(
      place,
      'computedMetrics.localGuidePercentile',
      computePercentile(localGuidePercentagesForPlaces, place.computedMetrics.localGuidePercentage)
    );
    _.set(
      place,
      'computedMetrics.userRatingsTotalPercentile',
      computePercentile(userRatingsTotalsForPlaces, place.userRatingsTotal)
    );
  }

  // adjust total rating based on computed metrics
  for (const place of places) {
    _.set(place, 'computedMetrics.adjustedRating', getAdjustedRating(place));
  }
};

const getPercentageIsLocalGuide = (reviews: IReview[]) => {

  if (!reviews.length) {
    return 0;
  }

  let localGuideCount = 0;
  for (const review of reviews) {
    if (review.authorIsLocalGuide) {
      localGuideCount++;
    }
  }

  return localGuideCount / reviews.length;
};

const computePercentile = (arr: number[], n: number) => {
  const total = arr.length;
  return (total * 100) / (n - 1); // TODO: I think this is wrong
};

const getAdjustedRating = (place: IPlace) => {
  const { rating, computedMetrics } = place;
  const { localGuidePercentile, userRatingsTotalPercentile } = computedMetrics;

  return 0.6 * rating + 0.2 * localGuidePercentile + 0.2 * userRatingsTotalPercentile;
};
