import pMap from 'p-map';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { sleep } from './core/utils';
import { IRawPlace } from './places/entities/IRawPlace';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const GOOGLE_BASE_URL = 'https://maps.googleapis.com/maps/api';

// taken from here: https://developers.google.com/maps/documentation/places/web-service/supported_types
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

export const getRawPlacesFromGoogle = async (lat: number, lng: number, radius: number, keyword?: string) => {
  if (!GOOGLE_MAPS_API_KEY) {
    throw new Error(`Must define the GOOGLE_MAPS_API_KEY`);
  }

  const basePlacesUrl = `${GOOGLE_BASE_URL}/place/nearbysearch/json?key=${GOOGLE_MAPS_API_KEY}`;

  const promises = [];
  for (const type of FOOD_PLACE_TYPES) {
    let urlForLocation = `${basePlacesUrl}&location=${lat},${lng}&radius=${radius}&type=${type}`;
    if (keyword) {
      urlForLocation = `${urlForLocation}&keyword=${keyword}`;
    }
    promises.push(fetchPlacesForType(basePlacesUrl, urlForLocation));
  }
  const responses = await Promise.all(promises);

  // create a Map to de-dupe any repeated places
  const allRawPlacesMap: Record<string, IRawPlace> = {};
  for (const results of responses) {
    for (const result of results) {
      allRawPlacesMap[result.place_id] = result;
    }
  }

  return Object.values(allRawPlacesMap);
};

const fetchPlacesForType = async (baseUrl: string, urlForLocation: string): Promise<IRawPlace[]> => {
  const allRawPlaces: IRawPlace[] = [];

  // default to the full URL with the location parameters (to be used on initial request)
  let url = urlForLocation;

  // only allowed 3 requests per URL (20 results per request)
  for (let requestNum = 1; requestNum < 4; requestNum++) {
    // if we're past the first request, sleep for 2 seconds as instructed by the Google API docs
    if (requestNum > 1) {
      await sleep(2);
    }

    // make the request to google
    // console.log(`Requesting nearby places for URL ${url}, requestNum=${requestNum}`);
    const response = await fetchDataFromGoogleAPI(url);

    // based on the response, decide if we need to make additional requests
    if (response && response.status === 200 && response.data.status === 'OK') {
      // add the places to the full list
      allRawPlaces.push(...response.data.results);

      // if we received a next_page_token, adjust the URL so that the next iteration through the loop uses that token
      if (response.data.next_page_token) {
        url = `${baseUrl}&pagetoken=${response.data.next_page_token}`;
      } else {
        // otherwise we have no more places to fetch, break out of the loop
        // console.log(`No more nearby places to fetch for URL ${url}, requestNum=${requestNum}`);
        break;
      }
    } else {
      const message = response ?? 'Error Occurred';
      console.error(`Error while requesting nearby place: ${message}`);
      break;
    }
  }

  return allRawPlaces;
};

export const fetchPlaceDetailsForPlaceIds = async (googlePlaceIds: string[]) => {
  const basePlaceDetailsBaseUrl = `${GOOGLE_BASE_URL}/place/details/json?key=${GOOGLE_MAPS_API_KEY}&fields=url`;

  const urls = [];

  for (const googlePlaceId of googlePlaceIds) {
    const url = `${basePlaceDetailsBaseUrl}&place_id=${googlePlaceId}`;
    urls.push(url);
  }

  const responses = await pMap(urls, fetchDataFromGoogleAPI, { concurrency: 10 });

  const urlToGooglePlaceIdMap: Record<string, string> = {};

  for (const [index, response] of responses.entries()) {
    if (response && response.status === 200 && response.data.status === 'OK') {
      const googlePlaceId = googlePlaceIds[index];
      urlToGooglePlaceIdMap[googlePlaceId] = response?.data?.result?.url ?? null;
    }
  }

  return urlToGooglePlaceIdMap;
};

const fetchDataFromGoogleAPI = async (url: string): Promise<AxiosResponse | null> => {
  try {
    const requestConfig: AxiosRequestConfig = {
      method: 'get',
      url,
      headers: {},
    };
    return await axios(requestConfig);
  } catch (e) {
    console.error(`Error while requesting nearby place: ${e}`);
    return null;
  }
};
