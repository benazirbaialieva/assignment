import { faker } from '@faker-js/faker';

export interface RegistrationUser {
  fullName: string;
  email: string;
}

/** Strips anything the email format would choke on (spaces, apostrophes, accents). */
function toEmailPart(namePart: string): string {
  return namePart
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toLowerCase();
}

/** A fresh user on every call: faker name, email as firstname.lastname@gmail.com. */
export function generateUser(): RegistrationUser {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {
    fullName: `${firstName} ${lastName}`,
    email: `${toEmailPart(firstName)}.${toEmailPart(lastName)}@gmail.com`,
  };
}
