export interface Place {
  placeId: string;
  name: string;
  location: { lat: number; lng: number };
  vicinity: string;
  numPhotos: number;
  rating?: number | null;
  numRatings?: number | null;
  types: string[];
}
