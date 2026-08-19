import { api, ApiError } from './api.js';
import { session } from './session.js';
import { $, formatMoney, hideBanner, setBusy, showBanner, showFieldErrors } from './ui.js';

const current = session.requireOrRedirect();
const form = $('transaction-form');
const submit = $('transaction-submit');
const typeSelect = $('transaction-type');

$('logout-button').addEventListener('click', () => {
  session.clear();
  window.location.assign('/login.html');
});

// Recipient only applies to transfers.
const syncRecipientVisibility = () => {
  $('recipient-field').hidden = typeSelect.value !== 'transfer';
};
typeSelect.addEventListener('change', syncRecipientVisibility);

async function loadAccount() {
  const { data } = await api.getUser(current.id, current.token);
  $('user-name').textContent = data.name;
  $('account-balance').textContent = formatMoney(data.balance);
  $('account-id').textContent = data.id;
  $('account-type').textContent = data.accountType;
  $('account-email').textContent = data.email;
}

async function loadTransactions() {
  const { data } = await api.listTransactions(current.id, current.token);
  const body = $('transactions-body');
  body.replaceChildren();

  $('transactions-empty').hidden = data.length > 0;
  $('transactions-table').hidden = data.length === 0;

  for (const txn of data) {
    const row = document.createElement('tr');
    row.dataset.testid = 'transaction-row';
    row.dataset.transactionId = txn.id;
    // Outgoing transfers are shown as negative from this account's point of view.
    const outgoing = txn.userId === current.id && txn.type !== 'deposit';
    row.innerHTML = `
      <td>${new Date(txn.createdAt).toLocaleString('en-US')}</td>
      <td data-testid="row-type">${txn.type}</td>
      <td data-testid="row-amount">${outgoing ? '−' : '+'}${formatMoney(txn.amount)}</td>
      <td><span class="badge" data-testid="row-status" data-status="${txn.status}">${txn.status}</span></td>`;
    body.append(row);
  }
}

async function refresh() {
  try {
    await Promise.all([loadAccount(), loadTransactions()]);
    hideBanner('dashboard-error');
  } catch (error) {
    if (error instanceof ApiError && [401, 403].includes(error.status)) {
      session.clear();
      return window.location.assign('/login.html');
    }
    showBanner('dashboard-error', 'Could not load your account. Please refresh.');
  }
}

function validate({ amount, type, recipientId }) {
  const errors = {};
  if (!amount.trim()) errors.amount = 'Amount is required';
  else if (Number.isNaN(Number(amount)) ) errors.amount = 'Amount must be a number';
  else if (Number(amount) <= 0) errors.amount = 'Amount must be greater than 0';
  if (type === 'transfer' && !recipientId.trim()) errors.recipientId = 'Recipient account id is required';
  return errors;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideBanner('transaction-error');
  hideBanner('transaction-success');

  const raw = {
    amount: $('transaction-amount').value,
    type: typeSelect.value,
    recipientId: $('transaction-recipient').value,
    description: $('transaction-description').value,
  };

  const errors = validate(raw);
  showFieldErrors(form, errors);
  if (Object.keys(errors).length) {
    return showBanner('transaction-error', 'Please fix the highlighted fields.');
  }

  setBusy(submit, true, 'Sending…');
  try {
    const { data } = await api.createTransaction(
      {
        userId: current.id,
        amount: Number(raw.amount),
        type: raw.type,
        ...(raw.type === 'transfer' ? { recipientId: raw.recipientId.trim() } : {}),
        ...(raw.description.trim() ? { description: raw.description.trim() } : {}),
      },
      current.token,
    );

    const note =
      data.status === 'pending'
        ? `Transaction ${data.id} is pending review.`
        : `Transaction ${data.id} completed.`;
    showBanner('transaction-success', note, 'success');
    form.reset();
    syncRecipientVisibility();
    await refresh();
  } catch (error) {
    if (error instanceof ApiError) {
      showFieldErrors(form, error.fieldErrors());
      showBanner('transaction-error', error.message);
    } else {
      showBanner('transaction-error', 'Unable to reach the service. Please try again.');
    }
  } finally {
    setBusy(submit, false);
  }
});

syncRecipientVisibility();
refresh();
