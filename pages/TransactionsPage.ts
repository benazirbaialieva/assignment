import { Locator, Page, expect } from '@playwright/test';

/** Renders an amount the way the dashboard does, e.g. 1250 -> "$1,250.00". */
function formatMoney(amount: string | number): string {
  if (typeof amount === 'string' && amount.trim().startsWith('$')) return amount.trim();
  const value = typeof amount === 'number' ? amount : Number(amount.replace(/[$,\s]/g, ''));
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

/** The dashboard: account summary and the "New transaction" form. */
export class TransactionsPage {
  readonly page: Page;

  // Account summary
  readonly availableBalance: Locator;
  readonly accountId: Locator;

  // New transaction form
  readonly transactionForm: Locator;
  readonly typeSelect: Locator;
  readonly amountInput: Locator;
  readonly recipientField: Locator;
  readonly recipientInput: Locator;
  readonly submitButton: Locator;
  readonly successBanner: Locator;
  readonly errorBanner: Locator;

  constructor(page: Page) {
    this.page = page;

    this.availableBalance = page.getByTestId('account-balance');
    this.accountId = page.getByTestId('account-id');

    this.transactionForm = page.getByTestId('transaction-form');
    this.typeSelect = page.getByTestId('transaction-type');
    this.amountInput = page.getByTestId('transaction-amount');
    this.recipientField = page.getByTestId('recipient-field');
    this.recipientInput = page.getByTestId('transaction-recipient');
    this.submitButton = page.getByTestId('transaction-submit');
    this.successBanner = page.getByTestId('transaction-success');
    this.errorBanner = page.getByTestId('transaction-error');
  }

  /**
   * Picks one of the offered transaction types: transfer, deposit or withdrawal.
   * Accepts either the option value ("transfer") or its visible label ("Transfer").
   */
  async selectTransactionType(type: string): Promise<void> {
    await this.typeSelect.selectOption(type.trim().toLowerCase());
  }

  /** Asserts the account summary shows the given balance, e.g. 900 or "$900.00". */
  async verifyAvailableBalance(expected: string | number): Promise<void> {
    await expect(this.availableBalance).toHaveText(formatMoney(expected));
  }

  async fillAmount(amount: string | number): Promise<void> {
    await this.amountInput.fill(String(amount));
  }

  async fillRecipientId(recipientId: string): Promise<void> {
    await this.recipientInput.fill(recipientId);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /** The recipient field is only shown for transfers. */
  async isRecipientFieldVisible(): Promise<boolean> {
    return this.recipientField.isVisible();
  }

  /**
   * A surfaced transaction error, wherever the app puts it: the form's error
   * banner (server errors) or an inline field error (validation).
   */
  errorMessage(message: string): Locator {
    return this.page
      .locator('[data-field-error]')
      .or(this.errorBanner)
      .filter({ hasText: message })
      .first();
  }
}
