import { Locator, Page } from '@playwright/test';

export type AccountType = 'basic' | 'premium' | 'business';

export class RegistrationPage {
  readonly page: Page;

  readonly pageTitle: Locator;
  readonly form: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly accountTypeSelect: Locator;
  readonly createAccountButton: Locator;
  readonly errorBanner: Locator;
  readonly nameError: Locator;
  readonly emailError: Locator;
  readonly accountTypeError: Locator;

  constructor(page: Page) {
    this.page = page;

    this.pageTitle = page.getByTestId('page-title');
    this.form = page.getByTestId('register-form');
    this.fullNameInput = page.getByTestId('name-input');
    this.emailInput = page.getByTestId('email-input');
    this.accountTypeSelect = page.getByTestId('account-type-select');
    this.createAccountButton = page.getByTestId('register-submit');
    this.errorBanner = page.getByTestId('register-error');
    this.nameError = page.getByTestId('error-name');
    this.emailError = page.getByTestId('error-email');
    this.accountTypeError = page.getByTestId('error-accountType');
  }

  async open(): Promise<void> {
    await this.page.goto('/');
  }

  async fillFullName(fullName: string): Promise<void> {
    await this.fullNameInput.fill(fullName);
  }

  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async chooseAccountType(type: string): Promise<void> {
    await this.accountTypeSelect.selectOption(type.trim().toLowerCase());
  }

  async clickCreateAccount(): Promise<void> {
    await this.createAccountButton.click();
  }

  /** Fills the whole form and submits it. */
  async createAccount(fullName: string, email: string, accountType: string): Promise<void> {
    await this.fillFullName(fullName);
    await this.fillEmail(email);
    await this.chooseAccountType(accountType);
    await this.clickCreateAccount();
  }

  /** All account types the select currently offers, as option values. */
  async accountTypeOptions(): Promise<string[]> {
    return this.accountTypeSelect.locator('option').evaluateAll((options) =>
      options.map((option) => (option as HTMLOptionElement).value),
    );
  }
}
