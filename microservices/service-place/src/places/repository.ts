import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import _ from 'lodash';
import { ERROR_CODES } from '../consts';
import { computePlaceScores } from './compute-place-scores';
import { fetchPlacesForType } from './fetch-places-for-type';
import { FOOD_PLACE_TYPES, getDataFromJsonFile } from './utils';
import CustomError from '../core/custom-error';
import { PlaceHistorySchema } from './entities/IPlaceHistory';
import { PlaceSchema } from './entities/IPlace';
import { IRawPlace } from './entities/IRawPlace';

const placeModel = mongoose.models.Place || mongoose.model('Place', PlaceSchema);
const placeHistoryModel = mongoose.models.ReviewHistory || mongoose.model('PlaceHistory', PlaceHistorySchema);

const READ_SAVED_FILE = true; // for testing

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const baseDirectory = path.join(process.cwd(), 'data');

export const getPlace = async (placeId: string) => {
  const place = await placeModel.findOne({ _id: placeId });

  if (!place) {
    throw new CustomError(ERROR_CODES.PLACE_NOT_FOUND, `Place [${placeId}] not found`);
  }

  return { place };
};

export const getPlaceHistory = async (placeId: string) => {
  const placeHistory = await placeHistoryModel.findOne({ placeId });

  if (!placeHistory) {
    throw new CustomError(ERROR_CODES.PLACE_HISTORY_NOT_FOUND, `Place history not found for place [${placeId}]`);
  }

  return { placeHistory };
};

export const getPlacesNearby = async (lat: number, lng: number, radius: number, keyword?: string) => {
  const filePath = `${baseDirectory}/savedNearbySearch.json`;

  if (READ_SAVED_FILE) {
    const savedData = getDataFromJsonFile(filePath);
    if (!_.isEmpty(savedData)) {
      const places = computePlaceScores(savedData);
      return { places };
    }
  }

  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error(`Must define the GOOGLE_MAPS_API_KEY`);
  }

  const baseUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${GOOGLE_MAPS_API_KEY}`;

  const promises = [];
  for (const type of FOOD_PLACE_TYPES) {
    let urlForLocation = `${baseUrl}&location=${lat},${lng}&radius=${radius}&type=${type}`;
    if (keyword) {
      urlForLocation = `${urlForLocation}&keyword=${keyword}`;
    }
    promises.push(fetchPlacesForType(baseUrl, urlForLocation));
  }
  const responses = await Promise.all(promises);

  const allRawPlacesMap: Record<string, IRawPlace> = {};
  for (const results of responses) {
    for (const result of results) {
      allRawPlacesMap[result.place_id] = result;
    }
  }
  const allRawPlaces = Object.values(allRawPlacesMap);

  console.log(`Found a total of ${allRawPlaces.length} places`);

  fs.writeFileSync(filePath, JSON.stringify(allRawPlaces), 'utf8');

  const places = computePlaceScores(allRawPlaces);
  return { places };
};
