import path from 'path';
import { PythonShell } from 'python-shell';
import { createUUID, deleteFile, getDataFromJsonFile } from '../../core/utils';
import { IReview } from '../entities/IReview';
import { IRawReview } from '../entities/IRawReview';
import { IPlace } from 'src/places/entities/IPlace';
import { IAuthor } from '../entities/IAuthor';
import { IRawAuthor } from '../entities/IRawAuthor';
import { REVIEW_SOURCES } from '../../consts';

const SCRAPE_HEADLESS = process.env.SCRAPE_HEADLESS === 'true';

export const scrapeReviewsForPlace = async (place: IPlace, googleMapsUrl: string) => {
  const pathToPythonScraper = path.join(process.cwd(), 'src/reviews/scraper/place-scraper.py');
  await scrapeReviewsUsingPythonScriptAndGenerateJsonFile(place._id, googleMapsUrl, pathToPythonScraper);
  const filePath = path.join(process.cwd(), `src/reviews/scraper/${place._id}-place.json`);
  const rawResults = getDataFromJsonFile(filePath);
  const rawReviews: IRawReview[] = rawResults.reviews;
  deleteFile(filePath); // delete the JSON file now that we've grabbed the data
  return getPlaceReviewsFromRawResults(place, rawReviews);
};

export const scrapeReviewsForAuthor = async (authorStub: IAuthor, authorUrl: string) => {
  const pathToPythonScraper = path.join(process.cwd(), 'src/reviews/scraper/author-scraper.py');
  await scrapeReviewsUsingPythonScriptAndGenerateJsonFile(authorStub._id, authorUrl, pathToPythonScraper);
  const filePath = path.join(process.cwd(), `src/reviews/scraper/${authorStub._id}-author.json`);
  const rawResults = getDataFromJsonFile(filePath);
  const rawAuthor: IRawAuthor = rawResults.author;
  const rawReviews: IRawReview[] = rawResults.reviews;
  deleteFile(filePath); // delete the JSON file now that we've grabbed the data
  return getAuthorReviewsFromRawResults(authorStub, rawAuthor, rawReviews);
};

const scrapeReviewsUsingPythonScriptAndGenerateJsonFile = async (
  id: string,
  url: string,
  pathToPythonScraper: string
) => {
  const pythonOptions = {
    pythonOptions: ['-u'],
    args: [id, url, SCRAPE_HEADLESS.toString()],
  };

  await new Promise<void>((resolve, reject) => {
    PythonShell.run(pathToPythonScraper, pythonOptions, function (err, results) {
      if (err) {
        printPythonResults(results);
        reject(err);
      } else {
        printPythonResults(results);
        resolve();
      }
    });
  });
};

const printPythonResults = (results?: Record<string, unknown>[]) => {
  if (results && results.length) {
    console.log('Results from python scraper:');
    for (const result of results) {
      console.log(`### ${result}`);
    }
  }
};

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
