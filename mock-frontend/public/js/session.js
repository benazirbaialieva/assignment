/** Session lives in localStorage; UI tests can seed or clear it directly. */
const KEY = 'fintech.session';

export const session = {
  save(user) {
    localStorage.setItem(KEY, JSON.stringify({ id: user.id, name: user.name, token: user.token }));
  },
  read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? 'null');
    } catch {
      return null;
    }
  },
  clear() {
    localStorage.removeItem(KEY);
  },
  /** Sends the visitor to login unless a session exists. */
  requireOrRedirect() {
    const current = this.read();
    if (!current?.token) {
      window.location.replace('/login.html');
      return null;
    }
    return current;
  },
};
