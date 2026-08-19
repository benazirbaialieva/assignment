Automation framework for fintech company that processes financial transactions through a microservices architecture.


Mock server.


Endpoints: the four required ones, plus PATCH/DELETE /api/users/:id for full CRUD, GET /health, GET /api/notifications/:userId (notification service view), and POST /api/test/reset for per-suite isolation.
Auth (auth.js): service API key for registration, bearer tokens per user, an admin token that can reach anything. Cross-user access is 403, frozen accounts are 403, bad/missing tokens 401 — so the authz suite has real paths to assert.
Validation (validate.js): every failing field is returned at once in error.details, not just the first.
Money as integer cents (money.js) — avoids float-drift flakiness; 10.005 is rejected rather than silently rounded.
Realistic error scenarios: INSUFFICIENT_FUNDS (422, with balance vs requested), EMAIL_ALREADY_EXISTS (409), MALFORMED_JSON, and amounts ≥ $10k settling as pending so there's a deterministic non-terminal status.
Idempotency-Key replay returns the original transaction instead of double-charging.
Test affordances: x-mock-latency-ms and x-mock-status headers inject latency/failures; x-request-id is echoed on every response; JSON request logs for API response logging.
Config (config.js): all env-overridable, so one server backs local/CI/staging.

To run:
cd mock-server && npm start

