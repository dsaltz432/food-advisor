export const getGoogleMapsApiKey = async() => {
  return process.env.GOOGLE_MAPS_API_KEY ?? null;
};
