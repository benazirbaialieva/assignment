import { ApiError } from '../lib/errors.js';

export function notFoundHandler(req, _res, next) {
  next(new ApiError(404, 'NOT_FOUND', `No route for ${req.method} ${req.path}`));
}

// eslint-disable-next-line no-unused-vars -- Express identifies handlers by arity
export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json(err.toJSON(req.id));
  }

  // Malformed JSON bodies surface here from express.json()
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: { code: 'MALFORMED_JSON', message: 'Request body is not valid JSON' },
      requestId: req.id,
    });
  }

  console.error(JSON.stringify({ requestId: req.id, message: err?.message, stack: err?.stack }));
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Unexpected server error' },
    requestId: req.id,
  });
}
