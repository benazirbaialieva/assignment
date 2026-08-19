/** Error envelope shared by every endpoint, so tests can assert one shape. */
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }

  toJSON(requestId) {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
      requestId,
    };
  }
}

export const badRequest = (message, details) => new ApiError(400, 'VALIDATION_ERROR', message, details);
export const unauthorized = (message = 'Missing or invalid credentials') =>
  new ApiError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'You do not have access to this resource') =>
  new ApiError(403, 'FORBIDDEN', message);
export const notFound = (resource) => new ApiError(404, 'NOT_FOUND', `${resource} not found`);
export const conflict = (code, message) => new ApiError(409, code, message);
export const unprocessable = (code, message, details) => new ApiError(422, code, message, details);
