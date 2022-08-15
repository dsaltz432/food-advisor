import { Request, Response } from 'express';
import { HTTP_STATUS_CODES } from '../consts';
import { getPlace, getPlacesNearby } from './repository';

export const GetPlacesNearby = async (req: Request, res: Response) => {
  // const { lat, lng, radius, keyword } = req.params;
  const places = await getPlacesNearby(40.799465, -73.966473, 250);
  res.status(HTTP_STATUS_CODES.OK).json({ places });
};

export const GetPlace = async (req: Request, res: Response) => {
  const { placeId } = req.params;

  const place = await getPlace(placeId);
  res.status(HTTP_STATUS_CODES.OK).json({ place });
};
