import _ from 'lodash';
import { IPlace } from './entities/IPlace';

export const computePlaceScores = (places: IPlace[]): IPlace[] => {
  // for now just sort by the adjusted rating
  return _.orderBy(places, 'computedMetrics.adjustedRating', 'desc');
};
