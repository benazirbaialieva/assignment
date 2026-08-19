import { Then, When } from '@cucumber/cucumber';
import { apiKeyHeaders } from '../../utils/apiClient';
import { expect } from '../../utils/assertions';
import { buildUserPayload } from '../../utils/factories';
import { getByPath } from '../../utils/helpers';
import { PlaywrightWorld } from '../../utils/support/world';
import { asToken } from './tokens';

/* Endpoint-agnostic requests: any protected read can be driven from a table. */

When(
  'I send a GET request to {string} with the {string} token',
  async function (this: PlaywrightWorld, path: string, who: string) {
    await this.send('get', path, asToken(this, who));
  },
);

When(
  'I request the created user with an injected status of {string}',
  async function (this: PlaywrightWorld, status: string) {
    await this.send('get', `/api/users/${this.apiUser.id}`, {
      headers: { ...asToken(this, 'user').headers, 'x-mock-status': status },
    });
  },
);

When('I send a malformed JSON body to the users endpoint', async function (this: PlaywrightWorld) {
  await this.send('post', '/api/users', {
    headers: { ...apiKeyHeaders(), 'content-type': 'application/json' },
    data: `${JSON.stringify(buildUserPayload()).slice(0, -1)},`,
  });
});

/* Assertions on whatever the gateway answered. */

Then('the response status is {int}', function (this: PlaywrightWorld, status: number) {
  expect(this.response).toHaveStatus(status);
});

Then('the response error code is {string}', function (this: PlaywrightWorld, code: string) {
  expect(this.body).toHaveErrorCode(code);
});

Then('the response error message is {string}', function (this: PlaywrightWorld, message: string) {
  expect(this.body?.error?.message).toBe(message);
});

Then('the response includes a request id', function (this: PlaywrightWorld) {
  expect(this.body?.requestId).toBeTruthy();
});

Then(
  'the response field error for {string} is {string}',
  function (this: PlaywrightWorld, field: string, message: string) {
    expect(this.body).toHaveFieldError(field, message);
  },
);

Then('the response field {string} is {string}', function (this: PlaywrightWorld, path: string, expected: string) {
  expect(this.body).toHaveDataField(path, expected);
});

Then('the response field {string} starts with {string}', function (this: PlaywrightWorld, path: string, prefix: string) {
  expect(String(getByPath(this.body?.data, path))).toContain(prefix);
});

Then('the response includes a token', function (this: PlaywrightWorld) {
  expect(this.body?.data?.token).toBeTruthy();
});

Then('the response contains {int} transaction(s)', function (this: PlaywrightWorld, count: number) {
  expect((this.body?.data ?? []).length).toBe(count);
});
