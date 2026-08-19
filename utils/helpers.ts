import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { env } from './env';

/** Small pure helpers shared by the page objects and the step definitions. */

/** Renders an amount the way the app does, e.g. 1250 -> "$1,250.00". */
export function formatMoney(amount: string | number): string {
  if (typeof amount === 'string' && amount.trim().startsWith('$')) return amount.trim();
  const value = typeof amount === 'number' ? amount : Number(amount.replace(/[$,\s]/g, ''));
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

/**
 * Turns an Examples-table cell into a payload value. Numeric strings become
 * numbers so the server sees the type a real client would send;
 * "(empty)" sends an empty string.
 */
export function cellValue(value: string): unknown {
  if (value === '(empty)') return '';
  return /^-?\d+(\.\d+)?$/.test(value.trim()) ? Number(value) : value;
}

/** Applies one field override to a payload; "(omitted)" drops the field. */
export function withOverride(
  payload: Record<string, unknown>,
  field: string,
  value: string,
  resolve: (raw: string) => unknown = cellValue,
): Record<string, unknown> {
  const next = { ...payload };
  if (value === '(omitted)') delete next[field];
  else next[field] = resolve(value);
  return next;
}

/** Reads a dotted path out of an object, e.g. "data.balance". */
export function getByPath(source: unknown, path: string): unknown {
  return path.split('.').reduce<any>((value, key) => value?.[key], source);
}

/** Keeps logged bodies readable. */
export function truncate(text: string, max = 800): string {
  return text.length > max ? `${text.slice(0, max)}… (${text.length} chars)` : text;
}

/** Filesystem-safe name for a scenario, used for screenshot files. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

/** Path inside the reports directory, with the directory created. */
export function reportPath(folder: string, file: string): string {
  const directory = join(env.reportsDir, folder);
  mkdirSync(directory, { recursive: true });
  return join(directory, file);
}
