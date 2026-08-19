import { Router } from 'express';
import { store } from '../store.js';
import { config } from '../config.js';
import { forbidden, notFound, unprocessable } from '../lib/errors.js';
import { parsePagination, validateTransactionPayload } from '../lib/validate.js';
import { toCents, toDollars } from '../lib/money.js';
import { requireAuth, requireSelfOrAdmin } from '../middleware/auth.js';

export const transactionsRouter = Router();

const publicTransaction = (txn) => ({
  id: txn.id,
  userId: txn.userId,
  recipientId: txn.recipientId ?? null,
  amount: toDollars(txn.amountCents),
  currency: txn.currency,
  type: txn.type,
  status: txn.status,
  description: txn.description ?? null,
  balanceAfter: txn.balanceAfterCents === undefined ? null : toDollars(txn.balanceAfterCents),
  createdAt: txn.createdAt,
});

// POST /api/transactions — create transaction
transactionsRouter.post('/', requireAuth, (req, res) => {
  const payload = validateTransactionPayload(req.body);

  if (req.auth.role !== 'admin' && req.auth.userId !== payload.userId) {
    throw forbidden('You may only create transactions for your own account');
  }

  const sender = store.getUser(payload.userId);
  if (!sender) throw notFound('User');

  let recipient;
  if (payload.type === 'transfer') {
    recipient = store.getUser(payload.recipientId);
    if (!recipient) throw notFound('Recipient');
  }

  // Idempotency-Key replays return the original transaction instead of
  // double-charging — the behaviour a retry-on-timeout client depends on.
  const idempotencyKey = req.get('idempotency-key');
  if (idempotencyKey) {
    const seen = store.idempotency.get(idempotencyKey);
    if (seen) {
      if (seen.userId !== payload.userId) {
        throw unprocessable('IDEMPOTENCY_KEY_REUSED', 'Idempotency-Key was already used by another account');
      }
      return res
        .status(200)
        .set('idempotent-replay', 'true')
        .json({ data: publicTransaction(store.getTransaction(seen.transactionId)) });
    }
  }

  const amountCents = toCents(payload.amount);
  const debits = payload.type === 'transfer' || payload.type === 'withdrawal';

  if (debits && sender.balanceCents < amountCents) {
    throw unprocessable('INSUFFICIENT_FUNDS', 'Account balance is too low for this transaction', {
      balance: toDollars(sender.balanceCents),
      requested: toDollars(amountCents),
    });
  }

  // Amounts above the review threshold settle asynchronously, which gives the
  // suite a deterministic non-terminal status to assert against.
  const status = amountCents >= config.reviewThresholdCents ? 'pending' : 'completed';

  if (status === 'completed') {
    if (debits) sender.balanceCents -= amountCents;
    if (payload.type === 'deposit') sender.balanceCents += amountCents;
    if (recipient) recipient.balanceCents += amountCents;
  }

  const txn = store.createTransaction({
    userId: sender.id,
    recipientId: recipient?.id,
    amountCents,
    currency: 'USD',
    type: payload.type,
    status,
    description: payload.description,
    balanceAfterCents: sender.balanceCents,
    idempotencyKey,
  });

  if (idempotencyKey) {
    store.idempotency.set(idempotencyKey, { userId: sender.id, transactionId: txn.id });
  }

  store.pushNotification({ userId: sender.id, channel: 'push', template: `transaction.${status}`, transactionId: txn.id });
  if (recipient) {
    store.pushNotification({ userId: recipient.id, channel: 'push', template: 'transaction.received', transactionId: txn.id });
  }

  res.status(201).json({ data: publicTransaction(txn) });
});

// GET /api/transactions/:userId — list a user's transactions
transactionsRouter.get('/:userId', requireAuth, requireSelfOrAdmin('userId'), (req, res) => {
  if (!store.getUser(req.params.userId)) throw notFound('User');

  const { page, limit } = parsePagination(req.query);
  let items = store.listTransactionsForUser(req.params.userId);

  if (req.query.type) items = items.filter((t) => t.type === req.query.type);
  if (req.query.status) items = items.filter((t) => t.status === req.query.status);

  const start = (page - 1) * limit;
  res.json({
    data: items.slice(start, start + limit).map(publicTransaction),
    pagination: { page, limit, total: items.length, totalPages: Math.ceil(items.length / limit) || 0 },
  });
});
