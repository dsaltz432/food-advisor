import _ from 'lodash';
import { createUUID } from '../core/utils';
import { IRawPlace } from './entities/IRawPlace';
import { IPlace } from './entities/IPlace';

export const computePlaceScores = (results: IRawPlace[]): IPlace[] => {
  const places = getPlacesFromResults(results);

  const filteredPlaces = places.filter(filterForFoodPlacesOnly);

  // for now just sort by rating
  return _.orderBy(filteredPlaces, 'rating');
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

const getPlacesFromResults = (results: any[]): IPlace[] => {
  const now = new Date();
  const places = [];
  for (const result of results) {
    const place: IPlace = {
      _id: createUUID(),
      googlePlaceId: result.place_id,
      googleReference: result.reference,
      businessStatus: result.business_status,
      name: result.name,
      location: result.geometry.location,
      vicinity: result.vicinity,
      numPhotos: result.photos?.length ?? 0,
      rating: result.rating ?? null,
      userRatingsTotal: result.user_ratings_total ?? null,
      types: result.types,
      icon: result.icon,
      scope: result.scope,
      openingHours: result.openingHours,
      priceLevel: result.price_level,
      audit: {
        createdDate: now,
        updatedDate: null,
      },
    };
    places.push(place);
  }
  return places;
};
