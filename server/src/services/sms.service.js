/**
 * Thin wrapper around the Semaphore SMS API (https://semaphore.co).
 * Uses Node's built-in fetch (Node 18+) - no extra HTTP client dependency needed.
 */
const SEMAPHORE_URL = 'https://api.semaphore.co/api/v4/messages';

const isConfigured = () => Boolean(process.env.SEMAPHORE_API_KEY);

/**
 * @param {string|string[]} numbers - PH mobile number(s), e.g. "09171234567"
 * @param {string} message
 */
const sendSms = async (numbers, message) => {
  if (!isConfigured()) {
    console.warn('[SMS] SEMAPHORE_API_KEY not set - skipping SMS send.');
    return { skipped: true };
  }

  const recipients = Array.isArray(numbers) ? numbers.join(',') : numbers;
  if (!recipients) return { skipped: true };

  const body = new URLSearchParams({
    apikey: process.env.SEMAPHORE_API_KEY,
    number: recipients,
    message,
  });
  // Omit sendername entirely when unset so Semaphore falls back to the account's
  // approved default - passing an unregistered name here makes the API call fail.
  if (process.env.SEMAPHORE_SENDER_NAME) {
    body.set('sendername', process.env.SEMAPHORE_SENDER_NAME);
  }

  const response = await fetch(SEMAPHORE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Semaphore SMS failed (${response.status}): ${text}`);
  }

  return response.json();
};

/** Sends the same alert to many recipients in Semaphore's 1000-recipient batches. */
const broadcastSms = async (numbers, message) => {
  const validNumbers = numbers.filter(Boolean);
  const batches = [];
  for (let i = 0; i < validNumbers.length; i += 1000) {
    batches.push(validNumbers.slice(i, i + 1000));
  }
  const results = [];
  for (const batch of batches) {
    // eslint-disable-next-line no-await-in-loop
    results.push(await sendSms(batch, message));
  }
  return results;
};

const isEnabledInSettings = async () => {
  const Setting = require('../models/Setting');
  const sms = await Setting.findOne({ key: 'sms' }).lean();
  return sms?.value?.enabled !== false;
};

/**
 * Settings-aware, logged SMS send used by every feature module. Never throws:
 * SMS is a secondary channel and must not fail the request that triggered it.
 */
const deliverSms = async ({ numbers, message, purpose = 'other', sentBy }) => {
  const SmsLog = require('../models/SmsLog');
  const list = (Array.isArray(numbers) ? numbers : [numbers]).filter(Boolean);
  const base = { purpose, message, recipientCount: list.length, recipients: list.slice(0, 5), sentBy };

  try {
    if (!list.length || !isConfigured() || !(await isEnabledInSettings())) {
      await SmsLog.create({ ...base, status: 'skipped' });
      return { skipped: true };
    }
    const result = await broadcastSms(list, message);
    await SmsLog.create({ ...base, status: 'sent' });
    return result;
  } catch (err) {
    console.error(`[SMS] ${purpose} failed:`, err.message);
    await SmsLog.create({ ...base, status: 'failed', error: err.message }).catch(() => {});
    return { error: err.message };
  }
};

/** Semaphore account info (credit balance etc.); null when not configured or unreachable. */
const getAccountInfo = async () => {
  if (!isConfigured()) return null;
  try {
    const response = await fetch(
      `https://api.semaphore.co/api/v4/account?apikey=${encodeURIComponent(process.env.SEMAPHORE_API_KEY)}`
    );
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
};

module.exports = { sendSms, broadcastSms, deliverSms, getAccountInfo, isConfigured };
