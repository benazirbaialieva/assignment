import { APIRequestContext } from '@playwright/test';
import { generateUser } from './testData';

export const API_BASE_URL = process.env.API_BASE_URL ?? 'http://127.0.0.1:4000';
const API_KEY = process.env.API_KEY ?? 'test-api-key';

export interface ApiUser {
  id: string;
}

/**
 * Creates a user straight through the API gateway and returns it, including the
 * generated usr_… id. Used for preconditions (a transfer needs a real
 * recipient) so the setup does not go through the UI.
 */
export async function createUserViaApi(request: APIRequestContext): Promise<ApiUser> {
  const generated = generateUser();

  const response = await request.post('/api/users', {
    headers: { 'x-api-key': API_KEY },
    data: { name: generated.fullName, email: generated.email, accountType: 'basic' },
  });

  if (!response.ok()) {
    throw new Error(`Could not create user via API: ${response.status()} ${await response.text()}`);
  }

  const { data } = (await response.json()) as { data: ApiUser };
  return data;
}
