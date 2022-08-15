import _ from 'lodash';
import { IReview } from '../reviews/entities/IReview';
import { IPlace } from './entities/IPlace';

export const addMetricsForReviews = (places: IPlace[], reviewsPerPlaces: Record<string, IReview[]>) => {
  // compute the percentage of reviews that come from local guides for each place
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
      computePercentRank(localGuidePercentagesForPlaces, place.computedMetrics.localGuidePercentage)
    );
    _.set(
      place,
      'computedMetrics.userRatingsTotalPercentile',
      computePercentRank(userRatingsTotalsForPlaces, place.userRatingsTotal)
    );
  }

  // compute adjusted total rating based on computed metrics
  for (const place of places) {
    _.set(place, 'computedMetrics.adjustedRating', getAdjustedRating(place));
  }
};

const computePercentRank = (arr: number[], value: number): number => {
  if (value === 0) {
    return 0;
  }

  let valueAboveItems = 0;

  for (const item of arr) {
    if (value >= item) {
      valueAboveItems++;
    }
  }

  return 100 * (valueAboveItems / arr.length);
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

  return 100 * (localGuideCount / reviews.length);
};

const getAdjustedRating = (place: IPlace) => {
  const { rating, computedMetrics } = place;
  const { localGuidePercentile, userRatingsTotalPercentile } = computedMetrics;

  // in practice this gives 60% weight to rating, 20% weight to localGuidePercentile, 20% weight to userRatingsTotalPercentile
  // this keeps the scale out of 5

  const ratingValue = (3 * rating) / 5;
  const localGuideValue = (1 * localGuidePercentile) / 100;
  const numRatingsValue = (1 * userRatingsTotalPercentile) / 100;

  return ratingValue + localGuideValue + numRatingsValue;
};
