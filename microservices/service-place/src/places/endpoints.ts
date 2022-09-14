import { Request, Response } from 'express';
import { HTTP_STATUS_CODES } from '../consts';
import { getPlace, getPlacesNearby, processPlacesNearby } from './repository';

export const GetPlacesNearby = async (req: Request, res: Response) => {
  const { lat, lng, radius, keyword } = req.query;
  const places = await getPlacesNearby(
    parseFloat(lat as string),
    parseFloat(lng as string),
    parseFloat(radius as string),
    keyword as string
  );
  res.status(HTTP_STATUS_CODES.OK).json({ places });
};

export const ProcessPlacesNearby = async (req: Request, res: Response) => {
  const { lat, lng, radius, keyword } = req.query;
  await processPlacesNearby(
    parseFloat(lat as string),
    parseFloat(lng as string),
    parseFloat(radius as string),
    keyword as string
  );
  res.status(HTTP_STATUS_CODES.NO_CONTENT).json();
};

export const GetPlace = async (req: Request, res: Response) => {
  const { placeId } = req.params;

  const place = await getPlace(placeId);
  res.status(HTTP_STATUS_CODES.OK).json({ place });
};
