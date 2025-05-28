// server/utils/emailService.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporterOptions = {
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT, 10),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports like 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
};

// For services like Gmail that might require it, or for debugging
if (process.env.EMAIL_HOST && process.env.EMAIL_HOST.includes('gmail')) {
  transporterOptions.service = 'gmail';
}
// If using specific TLS configurations (usually not needed for major providers)
// transporterOptions.tls = { rejectUnauthorized: false };


const transporter = nodemailer.createTransport(transporterOptions);

export const sendMail = async (to, subject, htmlContent) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials (EMAIL_USER, EMAIL_PASS) not configured in .env. Skipping email sending.');
    return { success: false, error: new Error('Email service not configured.') };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to} with subject: ${subject}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Error sending email to ${to} with subject "${subject}":`, error.message);
    // Log more detailed error if available
    if (error.response) {
        console.error('Error response:', error.response);
    }
    if (error.responseCode) {
        console.error('Error response code:', error.responseCode);
    }
    return { success: false, error };
  }
};