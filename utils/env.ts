import dotenv from 'dotenv';

// Values from a local .env file (never committed); real environment variables
// always win over both .env and the profile defaults below.
dotenv.config({ quiet: true });

const bool = (value: string | undefined, fallback: boolean): boolean =>
  value === undefined ? fallback : ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());

const num = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Per-environment defaults, chosen with TEST_ENV (default "local").
 * Every value stays overridable one by one, e.g. BASE_URL=… TEST_ENV=ci.
 */
const PROFILES = {
  local: {
    baseUrl: 'http://127.0.0.1:5173',
    apiBaseUrl: 'http://127.0.0.1:4000',
    headless: false,
    logToConsole: true,
  },
  ci: {
    baseUrl: 'http://127.0.0.1:5173',
    apiBaseUrl: 'http://127.0.0.1:4000',
    headless: true,
    logToConsole: false,
  },
  staging: {
    baseUrl: 'https://app.staging.northwind.example',
    apiBaseUrl: 'https://api.staging.northwind.example',
    headless: true,
    logToConsole: false,
  },
} as const;

export type EnvironmentName = keyof typeof PROFILES;

const name = (process.env.TEST_ENV ?? 'local') as EnvironmentName;
const profile = PROFILES[name];
if (!profile) {
  throw new Error(`Unknown TEST_ENV "${name}". Use one of: ${Object.keys(PROFILES).join(', ')}`);
}

const headless = bool(process.env.HEADLESS, profile.headless);

/** Single source of truth for everything environment-specific. */
export const env = {
  name,
  /** Mock web client under test. */
  baseUrl: process.env.BASE_URL ?? profile.baseUrl,
  /** API gateway under test. */
  apiBaseUrl: process.env.API_BASE_URL ?? profile.apiBaseUrl,

  /** Service-to-service key required by registration. */
  apiKey: process.env.API_KEY ?? 'test-api-key',
  /** Token that may read any account. */
  adminToken: process.env.ADMIN_TOKEN ?? 'admin-token',

  /** Browser channel: chrome, msedge, or empty for bundled Chromium. */
  browserChannel: process.env.BROWSER_CHANNEL ?? 'chrome',
  headless,
  /** Slowed down when headed so a run can be followed by eye. */
  slowMo: num(process.env.SLOW_MO, headless ? 0 : 250),
  stepTimeoutMs: num(process.env.STEP_TIMEOUT_MS, 30_000),

  /** Where reports, screenshots and logs are written. */
  reportsDir: process.env.REPORTS_DIR ?? 'reports',
  logApi: bool(process.env.LOG_API, true),
  logUi: bool(process.env.LOG_UI, true),
  /** debug | info | warn | error — the floor for what gets logged. */
  logLevel: (process.env.LOG_LEVEL ?? 'debug') as 'debug' | 'info' | 'warn' | 'error',
  logToConsole: bool(process.env.LOG_TO_CONSOLE, profile.logToConsole),
  screenshotOnFailure: bool(process.env.SCREENSHOT_ON_FAILURE, true),
  /** Record a Playwright trace and keep it when a UI scenario fails. */
  trace: bool(process.env.TRACE, false),

  /** Business rule mirrored from the server: balance a new account opens with. */
  openingBalance: num(process.env.OPENING_BALANCE, 1000),
} as const;
