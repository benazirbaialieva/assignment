import { config } from './config.js';
import { newId, newToken } from './lib/id.js';

/**
 * In-memory datastore standing in for MongoDB (users/transactions) and Redis
 * (notifications, idempotency keys). Everything is resettable so suites can run
 * in isolation without tearing down containers.
 */
class Store {
  constructor() {
    this.reset();
  }

  reset() {
    this.users = new Map(); // id -> user
    this.emailIndex = new Map(); // lowercased email -> id
    this.tokenIndex = new Map(); // token -> user id
    this.transactions = new Map(); // id -> transaction
    this.notifications = []; // Notification Service stand-in
    this.idempotency = new Map(); // key -> { userId, transactionId }
  }

  /* ------------------------------- users -------------------------------- */

  createUser({ name, email, accountType, balanceCents }) {
    const now = new Date().toISOString();
    const user = {
      id: newId('usr'),
      name,
      email,
      accountType,
      status: 'active',
      balanceCents: balanceCents ?? config.openingBalance,
      createdAt: now,
      updatedAt: now,
      token: newToken(),
    };
    this.users.set(user.id, user);
    this.emailIndex.set(email.toLowerCase(), user.id);
    this.tokenIndex.set(user.token, user.id);
    return user;
  }

  getUser(id) {
    return this.users.get(id);
  }

  getUserByEmail(email) {
    return this.users.get(this.emailIndex.get(String(email).toLowerCase()));
  }

  getUserByToken(token) {
    return this.users.get(this.tokenIndex.get(token));
  }

  updateUser(id, patch) {
    const user = this.users.get(id);
    if (!user) return undefined;
    if (patch.email && patch.email.toLowerCase() !== user.email.toLowerCase()) {
      this.emailIndex.delete(user.email.toLowerCase());
      this.emailIndex.set(patch.email.toLowerCase(), user.id);
    }
    Object.assign(user, patch, { updatedAt: new Date().toISOString() });
    return user;
  }

  deleteUser(id) {
    const user = this.users.get(id);
    if (!user) return false;
    this.users.delete(id);
    this.emailIndex.delete(user.email.toLowerCase());
    this.tokenIndex.delete(user.token);
    return true;
  }

  listUsers() {
    return [...this.users.values()];
  }

  /* ---------------------------- transactions ---------------------------- */

  createTransaction(txn) {
    const record = {
      id: newId('txn'),
      createdAt: new Date().toISOString(),
      ...txn,
    };
    this.transactions.set(record.id, record);
    return record;
  }

  getTransaction(id) {
    return this.transactions.get(id);
  }

  /** Transactions the user took part in, newest first. */
  listTransactionsForUser(userId) {
    return [...this.transactions.values()]
      .filter((t) => t.userId === userId || t.recipientId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  }

  /* ---------------------------- notifications --------------------------- */

  pushNotification(notification) {
    const record = { id: newId('ntf'), createdAt: new Date().toISOString(), ...notification };
    this.notifications.push(record);
    return record;
  }

  listNotifications(userId) {
    return this.notifications.filter((n) => !userId || n.userId === userId);
  }
}

export const store = new Store();
