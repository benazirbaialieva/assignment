import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '../../utils/assertions';
import { PlaywrightWorld } from '../../utils/support/world';
import { createUserViaApi } from '../../utils/apiClient';
import { env } from '../../utils/env';
import { buildUser } from '../../utils/factories';

Given('a recipient account exists', async function (this: PlaywrightWorld) {
  this.otherUser = await createUserViaApi(this.apiRequest);
  expect(this.otherUser.id).toMatch(/^usr_/);
});

Given('I am registered and signed in on the dashboard', async function (this: PlaywrightWorld) {
  this.user = buildUser();

  await this.registrationPage.open();
  await this.registrationPage.createAccount(this.user.fullName, this.user.email, 'basic');

  await this.page.waitForURL(/dashboard/);
  await expect(this.transactionsPage.transactionForm).toBeVisible();
  // The opening balance loads asynchronously; wait for it before acting on the form.
  await expect(this.transactionsPage.availableBalance).not.toHaveText('—');
});

When('I select {string} as the transaction type', async function (this: PlaywrightWorld, type: string) {
  await this.transactionsPage.selectTransactionType(type);
  await expect(this.transactionsPage.typeSelect).toHaveValue(type.trim().toLowerCase());
});

When('I enter {string} as the transaction amount', async function (this: PlaywrightWorld, amount: string) {
  await this.transactionsPage.fillAmount(amount);
});

When('I enter the recipient account id for transfers', async function (this: PlaywrightWorld) {
  // The app only shows (and only requires) the recipient field for transfers.
  if (!(await this.transactionsPage.isRecipientFieldVisible())) return;
  await this.transactionsPage.fillRecipientId(this.otherUser.id);
});

When('I submit the transaction', async function (this: PlaywrightWorld) {
  await this.transactionsPage.submit();
});

Then('verify the transaction is created successfully', async function (this: PlaywrightWorld) {
  await expect(this.transactionsPage.successBanner).toBeVisible();
  await expect(this.transactionsPage.successBanner).toHaveText(/^Transaction txn_.+ completed\.$/);
  await expect(this.transactionsPage.errorBanner).toBeHidden();
});

Then('verify available balance is {string}', async function (this: PlaywrightWorld, expectedBalance: string) {
  await this.transactionsPage.verifyAvailableBalance(expectedBalance);
});

/**
 * Recipient values in the Examples tables are either a literal id or one of two
 * keywords, since the ids are only known at runtime.
 */
async function resolveRecipientId(world: PlaywrightWorld, value: string): Promise<string> {
  const keyword = value.trim().toLowerCase();
  if (keyword === 'the recipient account id') return world.otherUser.id;
  if (keyword === 'my own account id') return (await world.transactionsPage.accountId.innerText()).trim();
  return value;
}

When('I enter {string} as the recipient account id', async function (this: PlaywrightWorld, value: string) {
  await this.transactionsPage.fillRecipientId(await resolveRecipientId(this, value));
});

Then('verify the error {string} is displayed', async function (this: PlaywrightWorld, message: string) {
  await expect(this.transactionsPage.errorMessage(message)).toBeVisible();
});

Then('verify the transaction is not created', async function (this: PlaywrightWorld) {
  await expect(this.transactionsPage.successBanner).toBeHidden();
  // Nothing left the account: the opening balance is untouched.
  await this.transactionsPage.verifyAvailableBalance(env.openingBalance);
});
