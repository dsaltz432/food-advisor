import { Request, Response, NextFunction, RequestHandler, ErrorRequestHandler } from 'express';
import { getLogger } from './logger';
const logger = getLogger('utilities.middleware');
import CustomError from './custom-error';
import { HTTP_STATUS_CODES } from '../consts';

export const timeEndpoint = (path: string) => {
  return function (_req: Request, res: Response, next: NextFunction) {
    const startTime = new Date().getTime();
    res.on('finish', function () {
      const elapsedTime = new Date().getTime() - startTime;
      console.info(`EndpointTiming: Path: ${path} took ${elapsedTime} milliseconds`);
    });
    next();
  };
};

export const asyncFunctionHandler = (handler: RequestHandler) => (req: Request, res: Response, next: NextFunction) => {
  return Promise.resolve(handler(req, res, next)).catch(next);
};

export const globalErrorHandler: ErrorRequestHandler = async (err, _req, res, _next) => {
  let statusCode = HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
  let logged = true;
  let errorId;
  let message;
  let details;

  if (err instanceof CustomError) {
    ({ errorId, statusCode, message, details, logged } = err);
  } else {
    details = err.stack;
  }

  if (logged) {
    let logMessage = '';
    if (errorId) {
      logMessage = `errorId: ${errorId}`;
    }
    if (message) {
      logMessage = `${logMessage}, message: ${message}`;
    }
    if (details) {
      logger.error(`${logMessage}, details: `, details);
    } else {
      logger.error(logMessage);
    }
  }

  const response = {
    ...(errorId && { errorId }),
    ...(message && { message }),
    ...(details && { details }),
  };

  res.status(statusCode).json(response);
};

export const fileNotFoundHandler = (req: Request, res: Response) => {
  res.status(HTTP_STATUS_CODES.NOT_FOUND).json(`Endpoint ${req.method} ${req.path} does not exist`);
};

module.exports = {
  timeEndpoint,
  asyncFunctionHandler,
  globalErrorHandler,
  fileNotFoundHandler,
};
