const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter with Brevo specific settings
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com', // Explicitly hardcoded to be safe
    port: 2525,                    // 👈 FIX: Use Port 2525 (Alternative SMTP port)
    secure: false,                 // Must be false for 2525
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false, // Fix for self-signed cert errors
    },
    connectionTimeout: 60000, // Wait 60s before timing out
    greetingTimeout: 30000,   // Wait 30s for server greeting
    debug: true,              // 👈 LOGGING: Show detailed SMTP logs in console
    logger: true              // 👈 LOGGING: Print logs to Render dashboard
  });

  const message = {
    from: `"CliniqueAI Security" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log("✅ Email sent: %s", info.messageId);
  } catch (error) {
    // Log the full error to help debug
    console.error("❌ Email Error Full:", JSON.stringify(error, null, 2));
    throw new Error("Email sending failed");
  }
};

module.exports = sendEmail;