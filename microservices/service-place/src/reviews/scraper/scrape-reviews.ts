import path from 'path';
import { PythonShell } from 'python-shell';
import { createUUID, deleteFile, getDataFromJsonFile } from '../../core/utils';
import { IReview } from '../entities/IReview';
import { IRawReview } from '../entities/IRawReview';

export const scrapeReviewsForPlace = async (placeId: string, url: string, headless: boolean) => {
  await scrapeReviewsUsingPythonScriptAndGenerateJsonFile(placeId, url, headless);
  const filePath = path.join(process.cwd(), `src/reviews/scraper/scraped-reviews/${placeId}.json`);
  const rawResults = getDataFromJsonFile(filePath);
  deleteFile(filePath); // delete the JSON file now that we've grabbed the data
  return getReviewsFromRawResults(placeId, rawResults);
};

const scrapeReviewsUsingPythonScriptAndGenerateJsonFile = async (placeId: string, url: string, headless: boolean) => {
  const pathToPythonScraper = path.join(process.cwd(), 'src/reviews/scraper/scraper.py');

  const pythonOptions = {
    pythonOptions: ['-u'],
    args: [placeId, url, headless.toString()],
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

const getReviewsFromRawResults = (placeId: string, rawResults: IRawReview[]) => {
  const reviews: IReview[] = [];

  for (const result of rawResults) {
    reviews.push({
      _id: createUUID(),
      placeId,
      authorName: result.authorName as string,
      authorUrl: result.authorUrl as string,
      authorIsLocalGuide: result.authorIsLocalGuide as boolean,
      authorNumReviews: result.authorNumReviews as number,
      rating: result.rating as number,
      timeDescription: result.timeDescription as string,
      text: result.text as string,
      audit: {
        createdDate: new Date(),
        updatedDate: null,
      },
    });
  }

  return reviews;
};
