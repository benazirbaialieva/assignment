import { store } from './store.js';

/**
 * Deterministic fixtures. Smoke tests and the mock UI can rely on these ids and
 * tokens existing on a cold start; everything else should create its own data.
 */
export const FIXTURES = [
  {
    id: 'usr_seed_alice',
    token: 'tok_seed_alice',
    name: 'Alice Anderson',
    email: 'alice@example.com',
    accountType: 'premium',
    balanceCents: 500000,
  },
  {
    id: 'usr_seed_bob',
    token: 'tok_seed_bob',
    name: 'Bob Baker',
    email: 'bob@example.com',
    accountType: 'basic',
    balanceCents: 25000,
  },
  {
    id: 'usr_seed_frozen',
    token: 'tok_seed_frozen',
    name: 'Frozen Fred',
    email: 'fred@example.com',
    accountType: 'basic',
    balanceCents: 0,
    status: 'frozen', // exercises the 403 path in requireAuth
  },
];

export function seedFixtures() {
  for (const fixture of FIXTURES) {
    const user = store.createUser(fixture);

    // Re-key the generated id/token onto the fixed fixture values.
    store.users.delete(user.id);
    store.tokenIndex.delete(user.token);
    Object.assign(user, { id: fixture.id, token: fixture.token, status: fixture.status ?? 'active' });
    store.users.set(user.id, user);
    store.emailIndex.set(user.email.toLowerCase(), user.id);
    store.tokenIndex.set(user.token, user.id);
  }
  return store.listUsers();
}
