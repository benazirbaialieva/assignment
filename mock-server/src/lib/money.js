/**
 * Money is stored as integer cents and only converted at the edges.
 * Floating point dollars are a classic source of flaky fintech assertions.
 */
export const toCents = (amount) => Math.round(Number(amount) * 100);
export const toDollars = (cents) => Number((cents / 100).toFixed(2));

/** Rejects values that cannot be represented exactly in cents (e.g. 10.005). */
export const hasValidPrecision = (amount) => {
  const str = String(amount);
  const decimals = str.includes('.') ? str.split('.')[1].length : 0;
  return decimals <= 2;
};
