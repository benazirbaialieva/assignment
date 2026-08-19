import { When } from '@cucumber/cucumber';
import { authHeaders } from '../../utils/apiClient';
import { buildTransaction } from '../../utils/factories';
import { cellValue, withOverride } from '../../utils/helpers';
import { PlaywrightWorld } from '../../utils/support/world';
import { asToken } from './tokens';

const TRANSACTIONS = '/api/transactions';

When(
  'I create a {string} transaction of {string} with the {string} token',
  async function (this: PlaywrightWorld, type: string, amount: string, who: string) {
    await this.send('post', TRANSACTIONS, {
      ...asToken(this, who),
      data: buildTransaction({
        userId: this.apiUser.id,
        amount: Number(amount),
        type,
        ...(type === 'transfer' ? { recipientId: this.otherUser.id } : {}),
      }),
    });
  },
);

When(
  'I create a transfer via the API with {string} set to {string}',
  async function (this: PlaywrightWorld, field: string, value: string) {
    const transfer = buildTransaction({ userId: this.apiUser.id, recipientId: this.otherUser.id });
    // "(self)" only makes sense at runtime, once the sender's id is known.
    const resolve = (raw: string) => (raw === '(self)' ? this.apiUser.id : cellValue(raw));

    await this.send('post', TRANSACTIONS, {
      headers: authHeaders(this.apiUser.token),
      data: withOverride({ ...transfer }, field, value, resolve),
    });
  },
);

When(
  'I create a transaction for user {string} with the {string} token',
  async function (this: PlaywrightWorld, ownerId: string, who: string) {
    const userId = ownerId === 'second user' ? this.otherUser.id : ownerId;
    await this.send('post', TRANSACTIONS, {
      ...asToken(this, who),
      data: buildTransaction({ userId, amount: 10, type: 'deposit' }),
    });
  },
);

When(
  'I list transactions for the created user with the {string} token',
  async function (this: PlaywrightWorld, who: string) {
    await this.send('get', `${TRANSACTIONS}/${this.apiUser.id}`, asToken(this, who));
  },
);
