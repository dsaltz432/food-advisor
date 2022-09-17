// import path from 'path';
// import { PythonShell } from 'python-shell';
// import { createUUID, deleteFile, getDataFromJsonFile } from '../../core/utils';
import { createUUID } from '../../core/utils';
import { IReview } from '../entities/IReview';
import { IRawReview } from '../entities/IRawReview';
import { IPlace } from '../../places/entities/IPlace';
import { IAuthor } from '../entities/IAuthor';
import { IRawAuthor } from '../entities/IRawAuthor';
import { HTTP_METHODS, REVIEW_SOURCES } from '../../consts';
import axios, { AxiosRequestConfig } from 'axios';

// const SCRAPE_HEADLESS = process.env.SCRAPE_HEADLESS === 'true';
const SCRAPE_SERVICE_URL = process.env.SCRAPE_SERVICE_URL;

export const scrapeReviewsForPlace = async (place: IPlace, googleMapsUrl: string) => {
  const rawReviews = await getRawPlaceReviewsFromScrapeService(place, googleMapsUrl);
  return getPlaceReviewsFromRawResults(place, rawReviews);
};

export const scrapeReviewsForAuthor = async (authorStub: IAuthor, authorUrl: string) => {
  const { rawReviews, rawAuthor } = await getRawAuthorReviewsFromScrapeService(authorStub, authorUrl);
  return getAuthorReviewsFromRawResults(authorStub, rawAuthor, rawReviews);
};

const getRawPlaceReviewsFromScrapeService = async (place: IPlace, googleMapsUrl: string): Promise<IRawReview[]> => {
  const requestConfig: AxiosRequestConfig = {
    method: HTTP_METHODS.POST,
    url: `${SCRAPE_SERVICE_URL}/v1/scraper/places/${place._id}`,
    headers: {},
    data: {
      googleMapsUrl,
    },
  };

  const results = await axios(requestConfig);

  if (!results || !results.data) {
    throw new Error(`Error fetching place reviews from scrape-service. Result is null`);
  }

  return results.data as unknown as IRawReview[];
};

const getRawAuthorReviewsFromScrapeService = async (
  author: IAuthor,
  authorUrl: string
): Promise<{ rawReviews: IRawReview[]; rawAuthor: IRawAuthor }> => {
  const requestConfig: AxiosRequestConfig = {
    method: HTTP_METHODS.POST,
    url: `${SCRAPE_SERVICE_URL}/v1/scraper/authors/${author._id}`,
    headers: {},
    data: {
      authorUrl,
    },
  };

  const results = (await axios(requestConfig)) as any;

  if (!results || !results.data || !results?.data?.author || !results?.data?.reviews) {
    throw new Error(`Error fetching author reviews from scrape-service. Result is null`);
  }

  const rawReviews = results?.data.reviews as IRawReview[];
  const rawAuthor = results?.data.author as IRawAuthor;

  return { rawReviews, rawAuthor };
};

// const scrapeReviewsUsingPythonScriptAndGenerateJsonFile = async (id: string, url: string, pathToPythonScraper: string) => {
//   const pythonOptions = {
//     pythonOptions: ['-u'],
//     args: [id, url, SCRAPE_HEADLESS.toString()],
//   };

//   await new Promise<void>((resolve, reject) => {
//     PythonShell.run(pathToPythonScraper, pythonOptions, function (err, results) {
//       if (err) {
//         printPythonResults(results);
//         reject(err);
//       } else {
//         printPythonResults(results);
//         resolve();
//       }
//     });
//   });
// };

// const printPythonResults = (results?: Record<string, unknown>[]) => {
//   if (results && results.length) {
//     console.log('Results from python scraper:');
//     for (const result of results) {
//       console.log(`### ${result}`);
//     }
//   }
// };

const getPlaceReviewsFromRawResults = (place: IPlace, rawReviews: IRawReview[]) => {
  const reviews: IReview[] = [];
  for (const rawReview of rawReviews || []) {
    reviews.push({
      _id: createUUID(),
      placeId: place._id,
      placeName: place.name,
      placeAddress: place.vicinity,
      authorId: null,
      googleAuthorId: rawReview.authorUrl.split('https://www.google.com/maps/contrib/')[1].split('/')[0],
      authorName: rawReview.authorName as string,
      authorUrl: rawReview.authorUrl as string,
      authorIsLocalGuide: rawReview.authorIsLocalGuide as boolean,
      authorNumReviews: rawReview.authorNumReviews as number,
      rating: rawReview.rating as number,
      timeDescription: rawReview.timeDescription as string,
      text: rawReview.text as string,
      source: REVIEW_SOURCES.PLACE_SCRAPER,
      audit: {
        createdDate: new Date(),
        updatedDate: null,
      },
    });
  }

  return { reviews };
};

const getAuthorReviewsFromRawResults = (authorStub: IAuthor, rawAuthor: IRawAuthor, rawReviews: IRawReview[]) => {
  const reviews: IReview[] = [];
  for (const rawReview of rawReviews || []) {
    reviews.push({
      _id: createUUID(),
      placeId: null,
      placeName: rawReview.placeName,
      placeAddress: rawReview.placeAddress,
      authorId: authorStub._id,
      googleAuthorId: authorStub.googleAuthorId,
      authorName: authorStub.authorName as string,
      authorUrl: authorStub.authorUrl,
      authorIsLocalGuide: authorStub.authorIsLocalGuide,
      authorNumReviews: authorStub.authorNumReviews,
      rating: rawReview.rating as number,
      timeDescription: rawReview.timeDescription as string,
      text: rawReview.text as string,
      source: REVIEW_SOURCES.AUTHOR_SCRAPER,
      audit: {
        createdDate: new Date(),
        updatedDate: null,
      },
    });
  }

  const author: IAuthor = authorStub;
  author.authorLevel = rawAuthor?.authorLevel ?? null;
  author.authorPoints = rawAuthor?.authorPoints ?? null;
  author.totalReviews = rawAuthor?.totalReviews ?? 0;
  author.totalRatings = rawAuthor?.totalRatings ?? 0;

  return {
    author,
    reviews,
  };
};
