import { api, ApiError } from './api.js';
import { session } from './session.js';
import { $, hideBanner, setBusy, showBanner, showFieldErrors } from './ui.js';

const form = $('login-form');
const submit = $('login-submit');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideBanner('login-error');

  const userId = $('user-id-input').value.trim();
  const token = $('token-input').value.trim();

  const errors = {};
  if (!userId) errors.userId = 'Account id is required';
  if (!token) errors.token = 'Access token is required';
  showFieldErrors(form, errors);
  if (Object.keys(errors).length) {
    return showBanner('login-error', 'Please fix the highlighted fields.');
  }

  setBusy(submit, true, 'Signing in…');
  try {
    // The token is verified by fetching the account it claims to own.
    const { data } = await api.getUser(userId, token);
    session.save({ ...data, token });
    window.location.assign('/dashboard.html');
  } catch (error) {
    const message =
      error instanceof ApiError && [401, 403, 404].includes(error.status)
        ? 'Invalid account id or access token.'
        : 'Unable to reach the service. Please try again.';
    showBanner('login-error', message);
  } finally {
    setBusy(submit, false);
  }
});
