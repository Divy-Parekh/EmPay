const nodemailer = require('nodemailer');
const env = require('../config/env');

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: false,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});

/**
 * Send employee credentials email.
 * @param {string} toEmail - Recipient email
 * @param {string} loginId - Generated login ID
 * @param {string} password - Generated plain-text password
 * @param {string} companyName - Company name
 */
async function sendCredentialsEmail(toEmail, loginId, password, companyName) {
  const mailOptions = {
    from: `"EmPay HRMS" <${env.smtp.user}>`,
    to: toEmail,
    subject: `Welcome to ${companyName} - Your EmPay Login Credentials`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px; background: #1E293B; color: #F8FAFC; border-radius: 12px;">
        <h2 style="color: #C084FC; margin-bottom: 20px;">Welcome to ${companyName}!</h2>
        <p>Your EmPay account has been created. Here are your login credentials:</p>
        <div style="background: #0F172A; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Login ID:</strong> <code style="color: #7C3AED; font-size: 16px;">${loginId}</code></p>
          <p><strong>Password:</strong> <code style="color: #7C3AED; font-size: 16px;">${password}</code></p>
        </div>
        <p style="color: #F59E0B;">⚠️ Please login and change your password immediately.</p>
        <p style="color: #94A3B8; font-size: 12px; margin-top: 30px;">This is an automated message from EmPay HRMS.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Credentials email sent to ${toEmail}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed to send email to ${toEmail}:`, err.message);
    // Don't throw — email failure shouldn't block account creation
    return false;
  }
}

module.exports = { sendCredentialsEmail };
