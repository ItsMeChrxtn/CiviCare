const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const parseFromHeader = (raw) => {
  const match = /^\s*"?([^"<]*)"?\s*<(.+)>\s*$/.exec(raw || '');
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: 'CiviCare', email: raw };
};

const baseWrapper = (title, bodyHtml) => `
  <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1f2937;">
    <h2 style="color: #0f766e;">CiviCare</h2>
    <h3>${title}</h3>
    ${bodyHtml}
    <hr style="margin-top:32px;border:none;border-top:1px solid #e5e7eb;" />
    <p style="font-size:12px;color:#9ca3af;">This is an automated message from the CiviCare Barangay Citizen Engagement System. Please do not reply to this email.</p>
  </div>
`;

const sendEmail = async ({ to, subject, html }) => {
  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: parseFromHeader(process.env.EMAIL_FROM),
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(`Brevo API error (${response.status}): ${errorBody.message || response.statusText}`);
  }
};

const sendVerificationEmail = (to, name, otpCode) =>
  sendEmail({
    to,
    subject: 'Your CiviCare verification code',
    html: baseWrapper(
      'Verify your email',
      `<p>Hi ${name},</p>
       <p>Thanks for registering with CiviCare. Enter this code in the app to activate your account:</p>
       <p style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0f766e;text-align:center;margin:24px 0;">${otpCode}</p>
       <p>This code expires in 10 minutes.</p>`
    ),
  });

const sendPasswordResetEmail = (to, name, resetUrl) =>
  sendEmail({
    to,
    subject: 'Reset your CiviCare password',
    html: baseWrapper(
      'Password reset request',
      `<p>Hi ${name},</p>
       <p>We received a request to reset your password. Click the button below to set a new one.</p>
       <p><a href="${resetUrl}" style="background:#0f766e;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Reset Password</a></p>
       <p>If you didn't request this, you can safely ignore this email. This link expires in 1 hour.</p>`
    ),
  });

// Panel revision: residents are emailed once an official has verified their account.
const sendAccountApprovedEmail = (to, name, loginUrl) =>
  sendEmail({
    to,
    subject: 'Your CiviCare account has been verified',
    html: baseWrapper(
      'Your account is ready',
      `<p>Hi ${name},</p>
       <p>Good news! The Barangay Magdiwang officials have verified your proof of residency and approved your CiviCare account.</p>
       <p>You can now log in and use the resident services.</p>
       <p><a href="${loginUrl}" style="background:#0f766e;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Log In to CiviCare</a></p>`
    ),
  });

const sendAccountRejectedEmail = (to, name, reason) =>
  sendEmail({
    to,
    subject: 'Your CiviCare registration was not approved',
    html: baseWrapper(
      'Registration not approved',
      `<p>Hi ${name},</p>
       <p>We could not verify your proof of residency, so your CiviCare account was not approved.</p>
       ${reason ? `<p><b>Reason:</b> ${String(reason).replace(/[<>&]/g, '')}</p>` : ''}
       <p>Please visit the Barangay Hall of Magdiwang with a valid proof of residence for assistance.</p>`
    ),
  });

const sendNotificationEmail = (to, title, message) =>
  sendEmail({
    to,
    subject: title,
    html: baseWrapper(title, `<p>${message}</p>`),
  });

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAccountApprovedEmail,
  sendAccountRejectedEmail,
  sendNotificationEmail,
};
