export interface Place {
  _id: string;
  name: string;
  location: { lat: number; lng: number };
  vicinity: string;
  numPhotos: number;
  rating?: number | null;
  userRatingsTotal?: number;
  types: string[];
  computedMetrics: any;
}
