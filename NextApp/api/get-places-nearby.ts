import axios, { AxiosRequestConfig } from 'axios';
import { Place } from '../types/Place';

const PLACE_SERVICE_URL = process.env.PLACE_SERVICE_URL ?? 'http://localhost:8081';

export const getNearbyPlaces = async (lat: number, lng: number, radius: number, keyword?: string) => {
  const places = await getPlacesFromPlaceService(lat, lng, radius, keyword);
  console.log(`Found [${places.length}] places from place-service`);
  return places;
};

const getPlacesFromPlaceService = async (lat: number, lng: number, radius: number, keyword?: string): Promise<Place[]> => {
  let url = `${PLACE_SERVICE_URL}/v1/places/nearby?lat=${lat}&lng=${lng}&radius=${radius}`;
  if (keyword) {
    url = `${url}&keyword=${keyword}`;
  }
  try {
    const requestConfig: AxiosRequestConfig = {
      method: 'get',
      url,
      headers: {},
    };
    const response = await axios(requestConfig);
    console.log(`response: ${response}`);
    if (response && response.status === 200) {
      return response.data.places ?? [];
    } else {
      return [];
    }
  } catch (e) {
    console.log(`Error while requesting nearby place: ${e}`);
    return [];
  }
};
