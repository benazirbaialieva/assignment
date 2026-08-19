import { badRequest } from './errors.js';
import { hasValidPrecision } from './money.js';
import { config } from '../config.js';

export const ACCOUNT_TYPES = ['basic', 'premium', 'business'];
export const TRANSACTION_TYPES = ['transfer', 'deposit', 'withdrawal'];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const push = (details, field, message) => details.push({ field, message });

/** Throws a 400 with every failing field, so one run surfaces all problems. */
const assertValid = (details) => {
  if (details.length) throw badRequest('Request body failed validation', details);
};

export function validateUserPayload(body, { partial = false } = {}) {
  const details = [];
  const has = (field) => body?.[field] !== undefined;

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw badRequest('Request body must be a JSON object');
  }

  if (!partial || has('name')) {
    const { name } = body;
    if (typeof name !== 'string' || name.trim().length === 0) push(details, 'name', 'name is required');
    else if (name.trim().length < 2) push(details, 'name', 'name must be at least 2 characters');
    else if (name.length > 100) push(details, 'name', 'name must be at most 100 characters');
  }

  if (!partial || has('email')) {
    const { email } = body;
    if (typeof email !== 'string' || email.trim().length === 0) push(details, 'email', 'email is required');
    else if (!EMAIL.test(email.trim())) push(details, 'email', 'email must be a valid email address');
  }

  if (has('accountType')) {
    if (!ACCOUNT_TYPES.includes(body.accountType)) {
      push(details, 'accountType', `accountType must be one of: ${ACCOUNT_TYPES.join(', ')}`);
    }
  }

  assertValid(details);

  return {
    ...(body.name !== undefined ? { name: String(body.name).trim() } : {}),
    ...(body.email !== undefined ? { email: String(body.email).trim() } : {}),
    ...(body.accountType !== undefined ? { accountType: body.accountType } : partial ? {} : { accountType: 'basic' }),
  };
}

export function validateTransactionPayload(body) {
  const details = [];

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw badRequest('Request body must be a JSON object');
  }

  const { userId, amount, type, recipientId, description } = body;

  if (typeof userId !== 'string' || userId.trim() === '') push(details, 'userId', 'userId is required');

  if (amount === undefined || amount === null || amount === '') {
    push(details, 'amount', 'amount is required');
  } else if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    push(details, 'amount', 'amount must be a number');
  } else if (amount <= 0) {
    push(details, 'amount', 'amount must be greater than 0');
  } else if (!hasValidPrecision(amount)) {
    push(details, 'amount', 'amount must have at most 2 decimal places');
  } else if (Math.round(amount * 100) > config.maxTransactionCents) {
    push(details, 'amount', `amount must not exceed ${config.maxTransactionCents / 100}`);
  }

  if (!TRANSACTION_TYPES.includes(type)) {
    push(details, 'type', `type must be one of: ${TRANSACTION_TYPES.join(', ')}`);
  }

  if (type === 'transfer') {
    if (typeof recipientId !== 'string' || recipientId.trim() === '') {
      push(details, 'recipientId', 'recipientId is required for transfers');
    } else if (recipientId === userId) {
      push(details, 'recipientId', 'recipientId must differ from userId');
    }
  }

  if (description !== undefined && (typeof description !== 'string' || description.length > 140)) {
    push(details, 'description', 'description must be a string of at most 140 characters');
  }

  assertValid(details);

  return {
    userId: userId.trim(),
    amount,
    type,
    recipientId: type === 'transfer' ? recipientId.trim() : undefined,
    description: description ?? undefined,
  };
}

/** Shared pagination parsing for list endpoints. */
export function parsePagination(query) {
  const details = [];
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);

  if (!Number.isInteger(page) || page < 1) push(details, 'page', 'page must be an integer >= 1');
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    push(details, 'limit', 'limit must be an integer between 1 and 100');
  }
  if (details.length) throw badRequest('Invalid query parameters', details);

  return { page, limit };
}
