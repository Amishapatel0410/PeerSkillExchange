const nodemailer = require('nodemailer');

/**
 * Creates a nodemailer transporter.
 * Uses env vars — never hard-coded credentials.
 *
 * Required env vars for email reminders:
 *   EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM
 *
 * If not configured, emails are skipped and a warning is logged.
 */
const getTransporter = () => {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    return null;
  }
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[Email] Not configured — skipping email to ${to}: ${subject}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

const sessionReminderHtml = (session, user) => `
  <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #6366f1;">SkillSync — Session Reminder</h2>
    <p>Hi ${user.name},</p>
    <p>You have an upcoming session:</p>
    <table style="border-collapse: collapse; width: 100%;">
      <tr><td style="padding: 8px; font-weight: bold;">Title:</td><td style="padding: 8px;">${session.title || 'Skill Exchange Session'}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold;">Date &amp; Time:</td><td style="padding: 8px;">${new Date(session.scheduledDateTime).toLocaleString()}</td></tr>
      <tr><td style="padding: 8px; font-weight: bold;">Duration:</td><td style="padding: 8px;">${session.duration} minutes</td></tr>
      <tr><td style="padding: 8px; font-weight: bold;">Meeting Link:</td><td style="padding: 8px;"><a href="${session.meetingLink}">${session.meetingLink}</a></td></tr>
    </table>
    <p style="margin-top: 20px; color: #6b7280; font-size: 12px;">
      ${session.meetingLinkType === 'placeholder' ? '⚠️ Note: This is a placeholder meeting link for demonstration purposes.' : ''}
    </p>
  </div>
`;

module.exports = { sendEmail, sessionReminderHtml };
