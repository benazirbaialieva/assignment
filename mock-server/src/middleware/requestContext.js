import { randomUUID } from 'node:crypto';
import { config } from '../config.js';

/** Stamps every request/response with a correlation id used in logs and errors. */
export function requestContext(req, res, next) {
  req.id = req.get('x-request-id') ?? randomUUID();
  req.startedAt = process.hrtime.bigint();
  res.set('x-request-id', req.id);

  res.on('finish', () => {
    if (!config.requestLogging) return;
    const ms = Number(process.hrtime.bigint() - req.startedAt) / 1e6;
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
        requestId: req.id,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Number(ms.toFixed(2)),
      }),
    );
  });

  next();
}
