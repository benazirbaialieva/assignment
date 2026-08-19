/**
 * Permissive CORS so the mock web client (a different origin) can call the
 * gateway directly. Custom headers must be allow-listed for preflight, and the
 * correlation/replay headers exposed so client code can read them.
 */
const ALLOWED_HEADERS = [
  'content-type',
  'authorization',
  'x-api-key',
  'idempotency-key',
  'x-request-id',
  'x-mock-latency-ms',
  'x-mock-status',
].join(', ');

export function cors(req, res, next) {
  res.set({
    'access-control-allow-origin': req.get('origin') ?? '*',
    'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers': ALLOWED_HEADERS,
    'access-control-expose-headers': 'x-request-id, idempotent-replay',
    'access-control-max-age': '600',
  });

  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
}
