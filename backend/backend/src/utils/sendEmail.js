const nodemailer = require('nodemailer');
const logger = require('./logger');

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
};

// options: { to, subject, text, html, attachments }
const sendEmail = async (options) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    logger.warn('SMTP is not configured — skipping email send.');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments || []
  };

  await getTransporter().sendMail(mailOptions);
};

module.exports = sendEmail;
