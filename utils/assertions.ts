import { APIResponse, Locator, expect as baseExpect } from '@playwright/test';
import { formatMoney, getByPath, truncate } from './helpers';

interface ErrorEnvelope {
  error?: { code?: string; message?: string; details?: Array<{ field: string; message: string }> };
  requestId?: string;
}

/**
 * Playwright's expect plus assertions written for this API and UI, so failures
 * report domain facts ("expected error code INSUFFICIENT_FUNDS") instead of
 * generic object diffs.
 */
export const expect = baseExpect.extend({
  /** The response carries the expected HTTP status. */
  toHaveStatus(response: APIResponse, expected: number) {
    const actual = response.status();
    return {
      pass: actual === expected,
      name: 'toHaveStatus',
      expected,
      actual,
      message: () => `Expected ${response.url()} to answer ${expected}, got ${actual} (${response.statusText()})`,
    };
  },

  /** The error envelope carries the expected machine-readable code. */
  toHaveErrorCode(body: any, expected: string) {
    const actual = body?.error?.code;
    return {
      pass: actual === expected,
      name: 'toHaveErrorCode',
      expected,
      actual,
      message: () => `Expected error code "${expected}", got "${actual}" (message: "${body?.error?.message}")`,
    };
  },

  /** The error envelope reports the expected message for a specific field. */
  toHaveFieldError(body: any, field: string, expected: string) {
    const details: Array<{ field: string; message: string }> = body?.error?.details ?? [];
    const actual = details.find((detail) => detail.field === field)?.message;
    return {
      pass: actual === expected,
      name: 'toHaveFieldError',
      expected,
      actual,
      message: () =>
        `Expected field "${field}" to report "${expected}", got ${
          actual ? `"${actual}"` : `no error for that field (details: ${truncate(JSON.stringify(details))})`
        }`,
    };
  },

  /** A value at a dotted path inside the response `data` matches, compared as text. */
  toHaveDataField(body: any, path: string, expected: string) {
    const actual = getByPath(body?.data, path);
    return {
      pass: String(actual) === expected,
      name: 'toHaveDataField',
      expected,
      actual,
      message: () => `Expected data.${path} to be "${expected}", got "${String(actual)}"`,
    };
  },

  /** A UI element shows the given money amount, in the app's own formatting. */
  async toShowMoney(locator: Locator, amount: string | number) {
    const expected = formatMoney(amount);
    try {
      await baseExpect(locator).toHaveText(expected);
      return { pass: true, name: 'toShowMoney', expected, message: () => `Expected not to show ${expected}` };
    } catch {
      const actual = await locator.innerText().catch(() => '<not visible>');
      return {
        pass: false,
        name: 'toShowMoney',
        expected,
        actual,
        message: () => `Expected ${expected} to be shown, got "${actual}"`,
      };
    }
  },
});
