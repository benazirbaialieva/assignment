import { setDefaultTimeout, setWorldConstructor, World } from '@cucumber/cucumber';
import { APIRequestContext, APIResponse, Browser, BrowserContext, Page, chromium, request } from '@playwright/test';
import { RegistrationPage } from '../../pages/RegistrationPage';
import { TransactionsPage } from '../../pages/TransactionsPage';
import { ApiEnvelope, ApiUser } from '../apiClient';
import { withRequestLogging } from '../apiLogger';
import { env } from '../env';
import { UserData } from '../factories';
import { reportPath } from '../helpers';
import { ScenarioLogger } from '../logger';

setDefaultTimeout(env.stepTimeoutMs);

export class PlaywrightWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;

  /** Direct API access, used for preconditions that should not go through the UI. */
  apiRequest!: APIRequestContext;

  registrationPage!: RegistrationPage;
  transactionsPage!: TransactionsPage;

  /** The generated user for the current scenario. */
  user!: UserData;

  /** The account a scenario acts as. */
  apiUser!: ApiUser;
  /** The other account a scenario needs: transfer recipient, or "someone else". */
  otherUser!: ApiUser;

  /** The last API response and its parsed body, for the Then steps to assert on. */
  response!: APIResponse;
  body: ApiEnvelope | null = null;

  /** Steps, browser events and API calls for this scenario. */
  readonly logger = new ScenarioLogger();

  async openApi(): Promise<void> {
    const context = await request.newContext({ baseURL: env.apiBaseUrl });

    this.apiRequest = env.logApi
      ? withRequestLogging(context, (entry) => {
          const level = entry.status >= 500 ? 'error' : entry.status >= 400 ? 'warn' : 'info';
          this.logger.api(level, `${entry.method.toUpperCase()} ${entry.url} -> ${entry.status} (${entry.durationMs}ms)`, {
            request: entry.requestBody,
            response: entry.responseBody,
          });
        })
      : context;
  }

  async openBrowser(): Promise<void> {
    this.browser = await chromium.launch({
      channel: env.browserChannel || undefined,
      headless: env.headless,
      slowMo: env.slowMo,
    });
    this.context = await this.browser.newContext({ baseURL: env.baseUrl });
    if (env.trace) await this.context.tracing.start({ screenshots: true, snapshots: true });

    this.page = await this.context.newPage();
    if (env.logUi) this.watchBrowser(this.page);

    this.registrationPage = new RegistrationPage(this.page);
    this.transactionsPage = new TransactionsPage(this.page);
  }

  /** Mirrors what the browser is doing into the scenario log. */
  private watchBrowser(page: Page): void {
    page.on('console', (message) => {
      const level = message.type() === 'error' ? 'error' : message.type() === 'warning' ? 'warn' : 'debug';
      this.logger.ui(level, `console.${message.type()}: ${message.text()}`);
    });

    page.on('pageerror', (error) => {
      this.logger.ui('error', `uncaught page error: ${error.message}`);
    });

    page.on('requestfailed', (failed) => {
      this.logger.ui('warn', `request failed: ${failed.method()} ${failed.url()} — ${failed.failure()?.errorText}`);
    });

    // The calls the app itself makes; the usual first place a UI failure shows up.
    page.on('response', (response) => {
      if (!response.url().startsWith(env.apiBaseUrl)) return;
      const level = response.status() >= 400 ? 'warn' : 'info';
      this.logger.ui(level, `xhr ${response.request().method()} ${response.url()} -> ${response.status()}`);
    });

    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) this.logger.ui('info', `navigated to ${frame.url()}`);
    });
  }

  /** Screenshots the browser, saves it under reports/ and attaches it to the report. */
  async captureScreenshot(name: string): Promise<void> {
    if (!this.page || !env.screenshotOnFailure) return;

    const file = reportPath('screenshots', `${name}.png`);
    this.attach(await this.page.screenshot({ path: file, fullPage: true }), 'image/png');
    this.logger.ui('error', `screenshot saved to ${file}`);
  }

  /** Stops tracing, keeping the trace only when a name is given. */
  async stopTrace(name?: string): Promise<void> {
    if (!this.context) return;
    if (!name) return this.context.tracing.stop();

    const file = reportPath('traces', `${name}.zip`);
    await this.context.tracing.stop({ path: file });
    this.logger.ui('info', `trace saved to ${file} — npx playwright show-trace ${file}`);
  }

  /** Sends a request and remembers the response, so every step reads the same way. */
  async send(
    method: 'get' | 'post' | 'patch' | 'delete',
    path: string,
    options: { headers?: Record<string, string>; data?: unknown } = {},
  ): Promise<void> {
    this.response = await this.apiRequest[method](path, options);
    this.body = this.response.status() === 204 ? null : await this.response.json().catch(() => null);
  }

  async close(): Promise<void> {
    await this.apiRequest?.dispose();
    await this.context?.close();
    await this.browser?.close();
  }
}

setWorldConstructor(PlaywrightWorld);
