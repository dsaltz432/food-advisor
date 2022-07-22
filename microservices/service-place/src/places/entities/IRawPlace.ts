export interface IRawPlace {
  place_id: string;
  reference: string;
  name: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  vicinity: string;
  photos: [
    {
      height: number;
      html_attributions: string[];
      photo_reference: string;
      width: number;
    }
  ];
  rating?: number;
  user_ratings_total?: number;
  types: string[];
}
