/**
 * Shared rendering helpers. Every message the tests assert on is written
 * through here, so the markup contract stays in one place.
 */
export const $ = (selector, root = document) => root.querySelector(`[data-testid="${selector}"]`);

export function showBanner(testid, message, tone = 'error') {
  const el = $(testid);
  el.textContent = message;
  el.dataset.tone = tone;
  el.hidden = false;
}

export function hideBanner(testid) {
  const el = $(testid);
  el.textContent = '';
  el.hidden = true;
}

/** Renders inline field errors from { field: message } and clears stale ones. */
export function showFieldErrors(form, errors) {
  form.querySelectorAll('[data-field-error]').forEach((el) => {
    const message = errors[el.dataset.fieldError];
    el.textContent = message ?? '';
    el.hidden = !message;
  });
}

export function setBusy(button, busy, busyLabel = 'Working…') {
  if (busy) {
    button.dataset.idleLabel = button.textContent;
    button.textContent = busyLabel;
  } else if (button.dataset.idleLabel) {
    button.textContent = button.dataset.idleLabel;
  }
  button.disabled = busy;
  button.dataset.busy = String(busy);
}

export const formatMoney = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
