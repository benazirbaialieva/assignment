import { randomUUID } from 'node:crypto';

/**
 * Prefixed, sortable-ish ids. Prefixes make failure output readable
 * ("usr_..." vs "txn_...") without leaking a database implementation.
 */
export const newId = (prefix) => `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 20)}`;
export const newToken = () => `tok_${randomUUID().replace(/-/g, '')}`;
