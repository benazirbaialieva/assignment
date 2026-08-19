import { Locator, Page } from '@playwright/test';

export class RegistrationPage {
  readonly page: Page;

  readonly form: Locator;
  readonly fullNameInput: Locator;
  readonly emailInput: Locator;
  readonly accountTypeSelect: Locator;
  readonly createAccountButton: Locator;
  readonly errorBanner: Locator;

  constructor(page: Page) {
    this.page = page;

    this.form = page.getByTestId('register-form');
    this.fullNameInput = page.getByTestId('name-input');
    this.emailInput = page.getByTestId('email-input');
    this.accountTypeSelect = page.getByTestId('account-type-select');
    this.createAccountButton = page.getByTestId('register-submit');
    this.errorBanner = page.getByTestId('register-error');
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

  /**
   * Picks one of the offered account types: basic, premium or business.
   * Accepts either the option value ("basic") or its visible label ("Basic").
   */
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
}
