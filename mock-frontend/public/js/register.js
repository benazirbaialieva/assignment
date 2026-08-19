import { api, ApiError } from './api.js';
import { session } from './session.js';
import { $, hideBanner, setBusy, showBanner, showFieldErrors } from './ui.js';

const form = $('register-form');
const submit = $('register-submit');

/** Client-side checks that mirror the server's, so empty submits never round-trip. */
function validate({ name, email }) {
  const errors = {};
  if (!name.trim()) errors.name = 'Name is required';
  else if (name.trim().length < 2) errors.name = 'Name must be at least 2 characters';
  if (!email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) errors.email = 'Enter a valid email address';
  return errors;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideBanner('register-error');

  const payload = {
    name: $('name-input').value,
    email: $('email-input').value,
    accountType: $('account-type-select').value,
  };

  const errors = validate(payload);
  showFieldErrors(form, errors);
  if (Object.keys(errors).length) {
    return showBanner('register-error', 'Please fix the highlighted fields.');
  }

  setBusy(submit, true, 'Creating account…');
  try {
    const { data } = await api.createUser({ ...payload, name: payload.name.trim(), email: payload.email.trim() });
    session.save(data);
    window.location.assign('/dashboard.html');
  } catch (error) {
    if (error instanceof ApiError) {
      showFieldErrors(form, error.fieldErrors());
      showBanner('register-error', error.message);
    } else {
      showBanner('register-error', 'Unable to reach the service. Please try again.');
    }
  } finally {
    setBusy(submit, false);
  }
});
