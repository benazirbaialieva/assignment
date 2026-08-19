/** Thin fetch wrapper that normalises the gateway's error envelope. */
const { apiBaseUrl, apiKey } = window.APP_CONFIG;

export class ApiError extends Error {
  constructor(status, payload) {
    const body = payload?.error ?? {};
    super(body.message ?? `Request failed with status ${status}`);
    this.status = status;
    this.code = body.code ?? 'UNKNOWN_ERROR';
    this.details = body.details;
    this.requestId = payload?.requestId;
  }

  /** Server-side field errors keyed by field name, for inline rendering. */
  fieldErrors() {
    if (!Array.isArray(this.details)) return {};
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

async function request(path, { method = 'GET', body, token, headers = {} } = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new ApiError(response.status, payload);
  return payload;
}

export const api = {
  createUser: (user) => request('/api/users', { method: 'POST', body: user, headers: { 'x-api-key': apiKey } }),
  getUser: (id, token) => request(`/api/users/${id}`, { token }),
  createTransaction: (txn, token) => request('/api/transactions', { method: 'POST', body: txn, token }),
  listTransactions: (userId, token, { limit = 20 } = {}) =>
    request(`/api/transactions/${userId}?limit=${limit}`, { token }),
};
