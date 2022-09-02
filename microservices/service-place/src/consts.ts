export enum HTTP_STATUS_CODES {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500,
}

export enum HTTP_METHODS {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  PUT = 'PUT',
}

export enum COLLECTIONS {
  AUTHORS = 'authors',
  PLACES = 'places',
  PLACE_HISTORY = 'placeHistory',
  REVIEWS = 'reviews',
  REVIEW_HISTORY = 'reviewHistory',
}

export enum REVIEW_SOURCES {
  AUTHOR_SCRAPER = 'authorScraper',
  PLACE_SCRAPER = 'placeScraper',
}

export enum AUTHOR_STATUSES {
  PENDING = 'pending',
  SCRAPED = 'scraped',
}

export const ERROR_CODES = {
  ERROR_INSERTING_PLACE: { errorId: 'err.1', statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR, logged: true },
  PLACE_HISTORY_NOT_FOUND: { errorId: 'err.2', statusCode: HTTP_STATUS_CODES.NOT_FOUND, logged: true },
  PLACE_NOT_FOUND: { errorId: 'err.3', statusCode: HTTP_STATUS_CODES.NOT_FOUND, logged: true },
  ERROR_INSERTING_REVIEWS: { errorId: 'err.4', statusCode: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR, logged: true },
  REVIEW_HISTORY_NOT_FOUND: { errorId: 'err.5', statusCode: HTTP_STATUS_CODES.NOT_FOUND, logged: true },
};
