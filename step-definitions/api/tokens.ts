import { authHeaders } from '../../utils/apiClient';
import { env } from '../../utils/env';
import { PlaywrightWorld } from '../../utils/support/world';

/**
 * Resolves the token keywords used in the feature files. Anything that is not a
 * keyword is passed through as a literal token, e.g. "tok_seed_alice".
 */
function tokenFor(world: PlaywrightWorld, who: string): string | undefined {
  switch (who.trim().toLowerCase()) {
    case 'user':
      return world.apiUser.token;
    case 'second user':
      return world.otherUser.token;
    case 'admin':
      return env.adminToken;
    case 'invalid':
      return 'tok_not_a_real_token';
    case 'none':
      return undefined;
    default:
      return who;
  }
}

/** Request options carrying the auth header for a token keyword. */
export function asToken(world: PlaywrightWorld, who: string): { headers: Record<string, string> } {
  return { headers: authHeaders(tokenFor(world, who)) };
}
