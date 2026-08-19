import { Given, Then, When } from '@cucumber/cucumber';
import { expect } from '../../utils/assertions';
import { PlaywrightWorld } from '../../utils/support/world';
import { buildUser } from '../../utils/factories';

Given('I am on the registration page', async function (this: PlaywrightWorld) {
  await this.registrationPage.open();
  await expect(this.registrationPage.form).toBeVisible();
});

When('I enter a randomly generated full name', async function (this: PlaywrightWorld) {
  this.user = buildUser();
  await this.registrationPage.fillFullName(this.user.fullName);
});

When('I enter a randomly generated email', async function (this: PlaywrightWorld) {
  await this.registrationPage.fillEmail(this.user.email);
});

When('I choose {string} as the account type', async function (this: PlaywrightWorld, accountType: string) {
  await this.registrationPage.chooseAccountType(accountType);
  await expect(this.registrationPage.accountTypeSelect).toHaveValue(accountType.trim().toLowerCase());
});

When('I click the Create account button', async function (this: PlaywrightWorld) {
  await this.registrationPage.clickCreateAccount();
});

Then('verify I am taken to the dashboard page', async function (this: PlaywrightWorld) {
  await this.page.waitForURL(/dashboard/);
  expect(this.page.url()).toContain('dashboard');
});

When('I enter {string} as the full name', async function (this: PlaywrightWorld, fullName: string) {
  await this.registrationPage.fillFullName(fullName);
});

When('I enter {string} as the email', async function (this: PlaywrightWorld, email: string) {
  await this.registrationPage.fillEmail(email);
});

Then('verify the banner {string} appears', async function (this: PlaywrightWorld, message: string) {
  await expect(this.registrationPage.errorBanner).toBeVisible();
  await expect(this.registrationPage.errorBanner).toHaveText(message);
});

Then('verify I am not taken to the dashboard page', async function (this: PlaywrightWorld) {
  expect(this.page.url()).not.toContain('dashboard');
  await expect(this.registrationPage.form).toBeVisible();
});
