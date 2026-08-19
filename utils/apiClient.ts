import { APIRequestContext } from '@playwright/test';
import { env } from './env';
import { UserData, buildUserPayload } from './factories';

/** Every endpoint answers with this envelope. */
export interface ApiEnvelope {
  data?: any;
  error?: { code?: string; message?: string; details?: Array<{ field: string; message: string }> };
  requestId?: string;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  accountType: string;
  status: string;
  balance: number;
  /** Returned only at creation time. */
  token: string;
}

/** Bearer header for a token, or no auth header at all when it is undefined. */
export function authHeaders(token?: string): Record<string, string> {
  return token ? { authorization: `Bearer ${token}` } : {};
}

/** Service-to-service header required by registration. */
export function apiKeyHeaders(key: string = env.apiKey): Record<string, string> {
  return { 'x-api-key': key };
}

/**
 * Creates a user straight through the API gateway and returns it, including the
 * generated usr_… id and its token. Used for preconditions so setup does not
 * have to go through the UI.
 */
export async function createUserViaApi(
  request: APIRequestContext,
  overrides: Partial<UserData> = {},
): Promise<ApiUser> {
  const response = await request.post('/api/users', {
    headers: apiKeyHeaders(),
    data: buildUserPayload(overrides),
  });

  if (!response.ok()) {
    throw new Error(`Could not create user via API: ${response.status()} ${await response.text()}`);
  }

  const { data } = (await response.json()) as { data: ApiUser };
  return data;
}
