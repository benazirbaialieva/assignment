Automation framework for fintech company that processes financial transactions through a microservices architecture.

Endpoints:
 - POST /api/users - Create user
 - GET /api/users/:id - Get user details
 - POST /api/transactions - Create transaction
 - GET /api/transactions/:userId - Get user transactions
 - PATCH /api/users/:id
 - DELETE /api/users/:id


To run app, run two separate terminal processes:
1. cd mock-server && npm start
2. cd mock-frontend && npm start

## Running the tests

One command that starts the mock services, runs the suite headless, writes the
reports and shows them at the end:

```bash
./run-tests.sh                 # every scenario
./run-tests.sh @api            # only scenarios tagged @api
./run-tests.sh "@ui and not @slow"
./run-tests.sh @auth --no-open # do not open the HTML report at the end
```

It reuses `mock-server` / `mock-frontend` if they are already running, and stops
only the ones it started itself. Set `CI=1` to skip opening the report.

Or drive Cucumber directly (services must already be up):

```bash
npm test              # everything (UI in a headed Chrome window, plus the API suite)
npm run test:ui       # UI scenarios only
npm run test:api      # API scenarios only (no browser, ~0.3s)
npm run test:headless # everything, browser hidden — use this in CI
npx cucumber-js --tags "@auth"   # any tag: @api @crud @errors @validation @auth
                                 # @happyPathRegistration @negativeRegistration
                                 # @successfulTransaction @failedTransaction
```

## Layout

```
features/ui/          Gherkin for the web client
features/api/         Gherkin for the API gateway
step-definitions/ui/  registration.steps.ts, transaction.steps.ts
step-definitions/api/ users / transactions / response steps, tokens.ts
pages/                Page objects (locators + actions)
utils/                Test utilities (below)
utils/support/        Cucumber World and hooks
reports/              Generated — reports, screenshots, logs (gitignored)
```

## Test utilities

| Module | Purpose |
| --- | --- |
| [utils/factories.ts](utils/factories.ts) | Test data factories: `buildUser`, `buildUserPayload`, `buildTransaction`. Faker-generated, unique per call, every field overridable. |
| [utils/helpers.ts](utils/helpers.ts) | Helper functions: money formatting/parsing, Examples-table value coercion, payload overrides, dotted-path lookup, slugify. |
| [utils/env.ts](utils/env.ts) | Environment configuration: `local` / `ci` / `staging` profiles for URLs, credentials, browser, timeouts and reporting. Reads `.env` (see `.env.example`); real env vars win. |
| [utils/assertions.ts](utils/assertions.ts) | Custom assertions: `toHaveStatus`, `toHaveErrorCode`, `toHaveFieldError`, `toHaveDataField`, `toShowMoney`. |
| [utils/apiClient.ts](utils/apiClient.ts) | API helpers: auth headers, `createUserViaApi` for preconditions. |
| [utils/apiLogger.ts](utils/apiLogger.ts) | Wraps the API context so every request/response is logged. |
| [utils/logger.ts](utils/logger.ts) | Scenario logger collecting steps, browser events and API calls. |

The environment is chosen with `TEST_ENV` (`local`, `ci` or `staging`); each
profile sets the URLs, headless mode and console logging. Any single value can
still be overridden on its own:

```bash
TEST_ENV=ci npm test                     # headless, quiet — what CI runs
TEST_ENV=staging npm run test:api        # staging URLs
```

Other overrides, all optional:

```bash
HEADLESS=true SLOW_MO=0 npm test         # hide the browser, full speed
BASE_URL=http://localhost:5173 npm test  # different host
BROWSER_CHANNEL= npm test                # bundled Chromium instead of Chrome
LOG_API=false npm test                   # turn API logging off
LOG_TO_CONSOLE=false npm test            # stop streaming the log to the terminal
LOG_LEVEL=info npm test                  # drop the per-step lines
LOG_LEVEL=warn npm test                  # only warnings and errors
TRACE=true npm test                      # keep a Playwright trace for failed UI scenarios
```

## Reporting

Every run writes to `reports/`:

| File | Format |
| --- | --- |
| `cucumber-report.html` | HTML report, with failure screenshots and API logs attached |
| `cucumber-report.json` | Cucumber JSON, for report tooling |
| `junit-report.xml` | JUnit XML, for CI test tabs |
| `cucumber-messages.ndjson` | Cucumber messages, the canonical machine format |
| `run.log` | One JSON line per event: steps, browser events, API calls |
| `api.log` | The API subset: method, url, status, duration, request and response bodies |
| `screenshots/` | Full-page PNG for every failed UI scenario |
| `traces/` | Playwright trace per failed UI scenario, when `TRACE=true` |

Screenshots are taken automatically when a UI scenario fails and are attached to
the HTML report as well as saved to disk.

## Logging

Every scenario collects a log and attaches it to its entry in the HTML report,
so a failure can be read back without a rerun:

- **test** — each step as it starts and finishes, with duration, and the error on failure
- **ui** — navigation, browser console output, uncaught page errors, failed
  requests, and every API call the page itself makes with its status
- **api** — every request the suite makes: method, url, status, duration, bodies

```
23:10:26.852 INFO  ui   navigated to http://127.0.0.1:5173/
23:10:26.962 INFO  ui   xhr POST http://127.0.0.1:4000/api/users -> 201
23:10:52.811 ERROR test step failed (5s): verify available balance is "$1.00"
             {"error":"Error: Expected $1.00 to be shown, got \"$900.00\""}
```

The log streams to the terminal as the run goes (colour-coded by level, on
stderr so it does not fight the Cucumber formatter) and the same lines land in
`reports/run.log` as JSON. Use `LOG_TO_CONSOLE=false` for a quiet run,
`LOG_LEVEL=info` or `warn` to cut the noise, and `TRACE=true` to also keep a
Playwright trace of failed UI scenarios (`npx playwright show-trace <file>`).
