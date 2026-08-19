import { Given, When } from '@cucumber/cucumber';
import { ApiUser, apiKeyHeaders, createUserViaApi } from '../../utils/apiClient';
import { buildUserPayload } from '../../utils/factories';
import { withOverride } from '../../utils/helpers';
import { PlaywrightWorld } from '../../utils/support/world';
import { asToken } from './tokens';

const USERS = '/api/users';

Given('a user exists via the API', async function (this: PlaywrightWorld) {
  this.apiUser = await createUserViaApi(this.apiRequest);
});

Given('a second user exists via the API', async function (this: PlaywrightWorld) {
  this.otherUser = await createUserViaApi(this.apiRequest);
});

When('I create a user via the API', async function (this: PlaywrightWorld) {
  await this.send('post', USERS, { headers: apiKeyHeaders(), data: buildUserPayload() });
  if (this.response.status() === 201) this.apiUser = this.body?.data as ApiUser;
});

When(
  'I create a user via the API with {string} set to {string}',
  async function (this: PlaywrightWorld, field: string, value: string) {
    await this.send('post', USERS, {
      headers: apiKeyHeaders(),
      data: withOverride(buildUserPayload(), field, value),
    });
  },
);

When('I create a user via the API without an API key', async function (this: PlaywrightWorld) {
  await this.send('post', USERS, { data: buildUserPayload() });
});

When('I create a user via the API with API key {string}', async function (this: PlaywrightWorld, key: string) {
  await this.send('post', USERS, { headers: apiKeyHeaders(key), data: buildUserPayload() });
});

When('I request the created user with the {string} token', async function (this: PlaywrightWorld, who: string) {
  await this.send('get', `${USERS}/${this.apiUser.id}`, asToken(this, who));
});

When(
  'I update the created user with {string} set to {string} using the {string} token',
  async function (this: PlaywrightWorld, field: string, value: string, who: string) {
    await this.send('patch', `${USERS}/${this.apiUser.id}`, {
      ...asToken(this, who),
      data: withOverride({}, field, value),
    });
  },
);

When('I delete the created user with the {string} token', async function (this: PlaywrightWorld, who: string) {
  await this.send('delete', `${USERS}/${this.apiUser.id}`, asToken(this, who));
});
