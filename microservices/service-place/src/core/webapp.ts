'use strict';
import express, { RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import { HTTP_METHODS, HTTP_STATUS_CODES } from '../consts';
import { getLogger } from './logger';
const logger = getLogger('utilities.webapp');
import { timeEndpoint, asyncFunctionHandler, globalErrorHandler, fileNotFoundHandler } from './middleware';

const PORT = process.env.PORT ?? 3000;

const app = express();

app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.urlencoded({ extended: true }));

const registerEndpoint = (method: string, path: string, next: RequestHandler) => {
  logger.info(`Endpoint ${method} ${path} registered.`);

  const middleware = [];

  middleware.push(timeEndpoint(path));

  switch (method) {
    case HTTP_METHODS.GET:
      app.get(path, middleware, asyncFunctionHandler(next));
      break;
    case HTTP_METHODS.POST:
      app.post(path, middleware, asyncFunctionHandler(next));
      break;
    case HTTP_METHODS.PUT:
      app.put(path, middleware, asyncFunctionHandler(next));
      break;
    case HTTP_METHODS.PATCH:
      app.patch(path, middleware, asyncFunctionHandler(next));
      break;
    case HTTP_METHODS.DELETE:
      app.delete(path, middleware, asyncFunctionHandler(next));
      break;
    default:
      throw new Error(`Unsupported http method [${method}]`);
  }
};

registerEndpoint(HTTP_METHODS.GET, '/health', async (_req, res) => res.status(HTTP_STATUS_CODES.OK).send('Up and running.'));

const start = () => {
  app.use(globalErrorHandler);

  // 404 error handler must come last
  app.use(fileNotFoundHandler);

  app.listen(PORT);

  logger.info(`Webapp started listening on port ${PORT}`);
};

export default {
  start,
  get: (path: string, next: RequestHandler) => registerEndpoint(HTTP_METHODS.GET, path, next),
  post: (path: string, next: RequestHandler) => registerEndpoint(HTTP_METHODS.POST, path, next),
  put: (path: string, next: RequestHandler) => registerEndpoint(HTTP_METHODS.PUT, path, next),
  patch: (path: string, next: RequestHandler) => registerEndpoint(HTTP_METHODS.PATCH, path, next),
  delete: (path: string, next: RequestHandler) => registerEndpoint(HTTP_METHODS.DELETE, path, next),
};
