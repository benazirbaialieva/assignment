# Mock Frontend

A dependency-free web client for the mock API — enough surface for the UI suite
to exercise registration, sign-in, and transaction creation, including the error
paths. Plain HTML/CSS/ES modules, no build step.

```bash
npm start                                   # http://127.0.0.1:5173
API_BASE_URL=http://127.0.0.1:4010 npm start
```

The API must be running (`cd ../mock-server && npm start`).

## Pages

| Path | Flow |
| --- | --- |
| `/` (`index.html`) | Registration → `POST /api/users`, stores session, redirects to dashboard |
| `/login.html` | Sign in with account id + access token (verified via `GET /api/users/:id`) |
| `/dashboard.html` | Balance + account details, new-transaction form, recent activity |

`/dashboard.html` redirects to `/login.html` when there is no session, and on any
`401`/`403` from the API. Extension-less paths resolve (`/dashboard` works).

## Configuration

`server.js` serves `/config.js`, which sets `window.APP_CONFIG` from the
environment — the same static build points at any environment:

| Env var | Default |
| --- | --- |
| `PORT` / `HOST` | `5173` / `127.0.0.1` |
| `API_BASE_URL` | `http://127.0.0.1:4000` |
| `API_KEY` | `test-api-key` |

The service API key sits in the client only because this is a test harness; a
real client would register through a backend-for-frontend.

## Test hooks

Every element the suite touches carries a `data-testid`. Text content is written
through [`public/js/ui.js`](public/js/ui.js), so the markup contract lives in one place.

**Forms:** `register-form`, `login-form`, `transaction-form`
**Inputs:** `name-input`, `email-input`, `account-type-select`, `user-id-input`,
`token-input`, `transaction-type`, `transaction-amount`, `transaction-recipient`,
`transaction-description`
**Buttons:** `register-submit`, `login-submit`, `transaction-submit`, `logout-button`
**Banners:** `register-error`, `login-error`, `dashboard-error`, `transaction-error`,
`transaction-success` (each `hidden` until raised; `data-tone="success"` on the happy path)
**Field errors:** `error-<field>` — e.g. `error-name`, `error-email`, `error-amount`,
`error-recipientId`. Populated from client validation *and* from the API's
`error.details[]`, so server rules render inline without duplicating them here.
**Account:** `account-balance`, `account-id`, `account-type`, `account-email`, `user-name`
**Activity:** `transactions-table`, `transactions-body`, `transactions-empty`,
`transaction-row` (carries `data-transaction-id`), `row-type`, `row-amount`,
`row-status` (carries `data-status`)

Buttons expose `data-busy="true"` while a request is in flight — a deterministic
signal to wait on instead of a timeout.

## Behaviours worth asserting

- Client validation blocks empty/invalid submits before any network call.
- Server errors render as a banner *and* inline: `409` duplicate email, `422`
  insufficient funds, `404` unknown recipient.
- Recipient input is hidden unless the type is `transfer`.
- Transactions ≥ $10,000 report "pending review" and show a `pending` badge.
- A failed fetch shows "Unable to reach the service", not a stack trace.
