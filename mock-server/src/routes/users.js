import { Router } from 'express';
import { store } from '../store.js';
import { conflict, notFound } from '../lib/errors.js';
import { validateUserPayload } from '../lib/validate.js';
import { toDollars } from '../lib/money.js';
import { requireApiKey, requireAuth, requireSelfOrAdmin } from '../middleware/auth.js';

export const usersRouter = Router();

/** Public projection: never leaks the auth token or internal cent balances. */
export const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  accountType: user.accountType,
  status: user.status,
  balance: toDollars(user.balanceCents),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// POST /api/users — create user (registration, service key auth)
usersRouter.post('/', requireApiKey, (req, res) => {
  const payload = validateUserPayload(req.body);

  if (store.getUserByEmail(payload.email)) {
    throw conflict('EMAIL_ALREADY_EXISTS', 'A user with that email already exists');
  }

  const user = store.createUser(payload);
  store.pushNotification({ userId: user.id, channel: 'email', template: 'welcome' });

  // The token is returned exactly once, at creation, like a real signup flow.
  res.status(201).json({ data: { ...publicUser(user), token: user.token } });
});

// GET /api/users/:id — get user details
usersRouter.get('/:id', requireAuth, requireSelfOrAdmin('id'), (req, res) => {
  const user = store.getUser(req.params.id);
  if (!user) throw notFound('User');
  res.json({ data: publicUser(user) });
});

// PATCH /api/users/:id — partial update
usersRouter.patch('/:id', requireAuth, requireSelfOrAdmin('id'), (req, res) => {
  const user = store.getUser(req.params.id);
  if (!user) throw notFound('User');

  const payload = validateUserPayload(req.body, { partial: true });
  if (payload.email) {
    const existing = store.getUserByEmail(payload.email);
    if (existing && existing.id !== user.id) {
      throw conflict('EMAIL_ALREADY_EXISTS', 'A user with that email already exists');
    }
  }

  res.json({ data: publicUser(store.updateUser(user.id, payload)) });
});

// DELETE /api/users/:id — remove user
usersRouter.delete('/:id', requireAuth, requireSelfOrAdmin('id'), (req, res) => {
  if (!store.deleteUser(req.params.id)) throw notFound('User');
  res.status(204).send();
});
