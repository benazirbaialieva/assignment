import { After, Before, setDefaultTimeout, setWorldConstructor, World } from '@cucumber/cucumber';
import { APIRequestContext, Browser, BrowserContext, Page, chromium, request } from '@playwright/test';
import { RegistrationPage } from '../../pages/RegistrationPage';
import { TransactionsPage } from '../../pages/TransactionsPage';
import { RegistrationUser } from '../../utils/testData';
import { API_BASE_URL, ApiUser } from '../../utils/apiClient';

setDefaultTimeout(30_000);

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:5173';
/** Headed by default so you can watch the run; set HEADLESS=true (e.g. in CI) to hide it. */
const HEADLESS = process.env.HEADLESS === 'true';
const SLOW_MO = Number(process.env.SLOW_MO ?? (HEADLESS ? 0 : 250));

export class PlaywrightWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  /** Direct API access, used for preconditions that should not go through the UI. */
  apiRequest!: APIRequestContext;

  registrationPage!: RegistrationPage;
  transactionsPage!: TransactionsPage;

  /** The faker-generated user for the current scenario. */
  user!: RegistrationUser;

  /** The account created as a transfer precondition, including its usr_… id. */
  recipient!: ApiUser;

  async open(): Promise<void> {
    this.browser = await chromium.launch({ channel: 'chrome', headless: HEADLESS, slowMo: SLOW_MO });
    this.context = await this.browser.newContext({ baseURL: BASE_URL });
    this.page = await this.context.newPage();
    this.registrationPage = new RegistrationPage(this.page);
    this.transactionsPage = new TransactionsPage(this.page);
    this.apiRequest = await request.newContext({ baseURL: API_BASE_URL });
  }

  async close(): Promise<void> {
    await this.apiRequest?.dispose();
    await this.context?.close();
    await this.browser?.close();
  }
}

setWorldConstructor(PlaywrightWorld);

Before(async function (this: PlaywrightWorld) {
  await this.open();
});

After(async function (this: PlaywrightWorld) {
  await this.close();
});
