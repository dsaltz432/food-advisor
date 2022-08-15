import { v4 as uuid } from 'uuid';
import fs from 'fs';

export const createUUID = () => {
  return uuid();
};

export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

export const isNotDefined = <T>(value: T | null | undefined): value is null | undefined => {
  return !isDefined(value);
};

export const sleep = async (seconds: number) => {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

export const getBulkInsertsForArray = (array: any[]) => {
  const updates = [];
  for (const item of array) {
    updates.push({
      insertOne: item,
    });
  }
  return updates;
};

export const getDataFromJsonFile = (filePath: string) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) {
    console.log(`No file found for filePath [${filePath}].`);
    return [];
  }
};

export const deleteFile = (filePath: string) => {
  try {
    fs.unlinkSync(filePath);
  } catch (e) {
    console.log(`No file found for filePath [${filePath}].`);
  }
};
