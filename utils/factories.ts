import { faker } from '@faker-js/faker';

export interface UserData {
  fullName: string;
  email: string;
  accountType: string;
}

export interface TransactionData {
  userId: string;
  amount: number;
  type: string;
  recipientId?: string;
  description?: string;
}

/** Strips anything the email format would choke on (spaces, apostrophes, accents). */
function toEmailPart(namePart: string): string {
  return namePart
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase();
}

/**
 * A fresh user on every call: faker name, email as firstname.lastname@gmail.com.
 * Any field can be overridden by the caller.
 */
export function buildUser(overrides: Partial<UserData> = {}): UserData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    fullName: `${firstName} ${lastName}`,
    email: `${toEmailPart(firstName)}.${toEmailPart(lastName)}@gmail.com`,
    accountType: 'basic',
    ...overrides,
  };
}

/** The same user, shaped the way POST /api/users expects it. */
export function buildUserPayload(overrides: Partial<UserData> = {}): Record<string, unknown> {
  const user = buildUser(overrides);
  return { name: user.fullName, email: user.email, accountType: user.accountType };
}

/** A valid transaction payload for POST /api/transactions. */
export function buildTransaction(overrides: Partial<TransactionData> & { userId: string }): TransactionData {
  return {
    amount: 100,
    type: 'transfer',
    ...overrides,
  };
}
