const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};

const sendVerificationEmail = (to, name, verifyUrl) =>
  sendEmail({
    to,
    subject: 'Verify your CiviCare account',
    html: baseWrapper(
      'Verify your email',
      `<p>Hi ${name},</p>
       <p>Thanks for registering with CiviCare. Please verify your email address to activate your account.</p>
       <p><a href="${verifyUrl}" style="background:#0f766e;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;">Verify Email</a></p>
       <p>Or copy this link: ${verifyUrl}</p>
       <p>This link expires in 24 hours.</p>`
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

const sendNotificationEmail = (to, title, message) =>
  sendEmail({
    to,
    subject: title,
    html: baseWrapper(title, `<p>${message}</p>`),
  });

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendNotificationEmail };
