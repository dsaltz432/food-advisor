import fs from 'fs';

// taken from here: https://developers.google.com/maps/documentation/places/web-service/supported_types
export const FOOD_PLACE_TYPES = [
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

export const getDataFromJsonFile = (filePath: string): any[] => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.error(`Unable to get data from path [${filePath}], ${e}`);
    return [];
  }
};
