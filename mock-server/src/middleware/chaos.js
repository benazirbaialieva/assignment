import { config } from '../config.js';
import { ApiError } from '../lib/errors.js';

/**
 * Opt-in failure injection driven by request headers, so negative-path and
 * resilience tests do not need a second server build.
 *
 *   x-mock-latency-ms: 750   -> delay the response
 *   x-mock-status: 503       -> force an error status
 */
export function chaos(req, res, next) {
  if (!config.chaosEnabled) return next();

  const status = Number.parseInt(req.get('x-mock-status') ?? '', 10);
  const latency = Number.parseInt(req.get('x-mock-latency-ms') ?? '', 10);
  const delay = Number.isFinite(latency) ? Math.min(Math.max(latency, 0), 10000) : 0;

  const proceed = () => {
    if (Number.isFinite(status) && status >= 400) {
      return next(new ApiError(status, 'INJECTED_FAILURE', `Injected failure with status ${status}`));
    }
    next();
  };

  if (delay > 0) setTimeout(proceed, delay);
  else proceed();
}
