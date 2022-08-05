import _ from 'lodash';
import { IPlace } from './entities/IPlace';

export const computePlaceScores = (places: IPlace[]): IPlace[] => {
  const filteredPlaces = places.filter(filterForFoodPlacesOnly);

  // for now just sort by the adjusted rating
  return _.orderBy(filteredPlaces, 'computedMetrics.adjustedRating');
};

const FOOD_PLACE_TYPES = [
  // 'bar',
  // 'night_club',
  'bakery',
  'cafe',
  // 'convenience_store',
  // 'gas_station',
  // 'home_goods_store',
  // 'liquor_store',
  // 'lodging',
  'meal_delivery',
  'meal_takeaway',
  // 'movie_theater',
  'restaurant',
  // 'shopping_mall',
  // 'supermarket',
  // 'tourist_attraction',
];

const filterForFoodPlacesOnly = (place: IPlace) => {
  for (const inScopeType of FOOD_PLACE_TYPES) {
    if (place.types.includes(inScopeType)) {
      console.log(`Match for place ${place._id} with type ${inScopeType}`);
      return true;
    }
  }
  console.log(`No match for place ${place._id} with types ${place.types}`);
  return false;
};
