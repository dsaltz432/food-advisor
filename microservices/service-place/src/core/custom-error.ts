class CustomError extends Error {
  errorId: string;
  statusCode: number;
  logged: boolean;
  message: string;
  details: unknown;

  constructor(errorCode: { errorId: string; statusCode: number; logged: boolean }, message: string, details?: unknown) {
    super();
    this.name = 'CustomError';
    this.errorId = errorCode.errorId;
    this.statusCode = errorCode.statusCode;
    this.logged = errorCode.logged;
    this.message = message;
    this.details = details;
  }
}

export default CustomError;
