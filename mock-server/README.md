# Mock API Server

The system under test: an API Gateway fronting the User, Transaction and
Notification services. State is in-memory (standing in for MongoDB + Redis) and
fully resettable, so suites run deterministically without containers.

```bash
npm install
npm start          # http://127.0.0.1:4000
PORT=4010 npm start
```

## Authentication

| Credential | Header | Used by |
| --- | --- | --- |
| Service API key | `x-api-key: test-api-key` | `POST /api/users`, `POST /api/test/reset` |
| User token | `authorization: Bearer <token>` | everything else |
| Admin token | `authorization: Bearer admin-token` | everything, any user |

A user token is returned **once**, in the `POST /api/users` response. A user may
only read/modify their own records; anything else is `403`.

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/health` | status, uptime, record counts |
| POST | `/api/users` | create user → `201` + token |
| GET | `/api/users/:id` | user details |
| PATCH | `/api/users/:id` | partial update |
| DELETE | `/api/users/:id` | `204` |
| POST | `/api/transactions` | create transaction → `201` |
| GET | `/api/transactions/:userId` | `?page=&limit=&type=&status=` |
| GET | `/api/notifications/:userId` | notification service view |
| POST | `/api/test/reset` | wipe + re-seed fixtures |

Success bodies are `{ "data": ... }` (list endpoints add `pagination`).
Errors are `{ "error": { "code", "message", "details?" }, "requestId" }`.

## Business rules worth asserting

- Amounts: `> 0`, at most 2 decimal places, `<= 1,000,000`.
- `type`: `transfer` | `deposit` | `withdrawal`; `transfer` requires a
  `recipientId` that exists and differs from `userId`.
- Debits beyond the balance → `422 INSUFFICIENT_FUNDS` with balance details.
- Amounts `>= $10,000` settle as `status: "pending"` and do not move balances.
- `Idempotency-Key` replays return the original transaction (`200`, header
  `idempotent-replay: true`) instead of charging twice.

## Error codes

`VALIDATION_ERROR` (400), `MALFORMED_JSON` (400), `UNAUTHORIZED` (401),
`FORBIDDEN` (403), `NOT_FOUND` (404), `EMAIL_ALREADY_EXISTS` (409),
`INSUFFICIENT_FUNDS` / `IDEMPOTENCY_KEY_REUSED` (422), `INTERNAL_ERROR` (500).

## Seeded fixtures

| id | token | account | balance |
| --- | --- | --- | --- |
| `usr_seed_alice` | `tok_seed_alice` | premium | 5000.00 |
| `usr_seed_bob` | `tok_seed_bob` | basic | 250.00 |
| `usr_seed_frozen` | `tok_seed_frozen` | basic (frozen → 403) | 0.00 |

## Test affordances

- `x-mock-latency-ms: 750` — delay the response (timeout/perf tests).
- `x-mock-status: 503` — force an error status (resilience tests).
- `x-request-id` — echoed back on every response for log correlation.

## Configuration

`PORT`, `HOST`, `API_KEY`, `ADMIN_TOKEN`, `OPENING_BALANCE_CENTS`,
`MAX_TRANSACTION_CENTS`, `REVIEW_THRESHOLD_CENTS`, `ENABLE_CHAOS`,
`REQUEST_LOGGING`, `SEED_FIXTURES`.
