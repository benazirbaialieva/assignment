/**
 * Runtime configuration. Everything is env-overridable so the same server image
 * can back local, ci and staging test runs.
 */
const num = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const bool = (value, fallback) =>
  value === undefined ? fallback : ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: num(process.env.PORT, 4000),
  host: process.env.HOST ?? '127.0.0.1',

  // Auth
  apiKey: process.env.API_KEY ?? 'test-api-key',
  adminToken: process.env.ADMIN_TOKEN ?? 'admin-token',

  // Business rules
  openingBalance: num(process.env.OPENING_BALANCE_CENTS, 100000), // $1,000.00
  maxTransactionCents: num(process.env.MAX_TRANSACTION_CENTS, 100000000), // $1,000,000.00
  reviewThresholdCents: num(process.env.REVIEW_THRESHOLD_CENTS, 1000000), // $10,000.00 -> pending

  // Test affordances
  chaosEnabled: bool(process.env.ENABLE_CHAOS, true),
  requestLogging: bool(process.env.REQUEST_LOGGING, true),
  seedFixtures: bool(process.env.SEED_FIXTURES, true),
};
