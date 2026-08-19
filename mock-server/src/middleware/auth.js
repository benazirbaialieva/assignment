import { config } from '../config.js';
import { store } from '../store.js';
import { forbidden, unauthorized } from '../lib/errors.js';

const bearer = (req) => {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
};

/**
 * Service-to-service key. Guards registration, which has no user token yet.
 * Mirrors how the API Gateway would authenticate an upstream caller.
 */
export function requireApiKey(req, _res, next) {
  const key = req.get('x-api-key');
  if (!key) return next(unauthorized('Missing x-api-key header'));
  if (key !== config.apiKey) return next(unauthorized('Invalid API key'));
  next();
}

/** Bearer token auth. Resolves req.auth = { userId, role }. */
export function requireAuth(req, _res, next) {
  const token = bearer(req);
  if (!token) return next(unauthorized('Missing bearer token'));

  if (token === config.adminToken) {
    req.auth = { userId: null, role: 'admin' };
    return next();
  }

  const user = store.getUserByToken(token);
  if (!user) return next(unauthorized('Invalid or expired token'));
  if (user.status !== 'active') return next(forbidden('Account is not active'));

  req.auth = { userId: user.id, role: 'user' };
  req.user = user;
  next();
}

/**
 * Authorization: a user may only reach their own records; admins may reach any.
 * `param` names the route parameter holding the owning user id.
 */
export function requireSelfOrAdmin(param) {
  return (req, _res, next) => {
    if (req.auth?.role === 'admin') return next();
    if (req.auth?.userId && req.auth.userId === req.params[param]) return next();
    next(forbidden('You may only access your own resources'));
  };
}
