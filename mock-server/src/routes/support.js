import { Router } from 'express';
import { store } from '../store.js';
import { config } from '../config.js';
import { seedFixtures } from '../seed.js';
import { requireApiKey, requireAuth, requireSelfOrAdmin } from '../middleware/auth.js';
import { publicUser } from './users.js';

/**
 * Endpoints that exist for the test framework rather than for product use:
 * health, deterministic reset/seed, and a read-only Notification Service view.
 */
export const supportRouter = Router();

supportRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    env: config.env,
    uptimeSeconds: Number(process.uptime().toFixed(2)),
    counts: { users: store.users.size, transactions: store.transactions.size },
  });
});

// POST /api/test/reset — wipe state and re-seed fixtures between suites
supportRouter.post('/api/test/reset', requireApiKey, (_req, res) => {
  store.reset();
  const users = config.seedFixtures ? seedFixtures() : [];
  res.json({ data: { reset: true, seededUsers: users.map(publicUser) } });
});

// GET /api/notifications/:userId — Notification Service (Redis) stand-in
supportRouter.get('/api/notifications/:userId', requireAuth, requireSelfOrAdmin('userId'), (req, res) => {
  res.json({ data: store.listNotifications(req.params.userId) });
});
