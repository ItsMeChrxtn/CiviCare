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
    sendername: process.env.SEMAPHORE_SENDER_NAME || 'CiviCare',
  });

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

module.exports = { sendSms, broadcastSms, isConfigured };
