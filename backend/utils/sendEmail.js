const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create Transporter for BREVO (Sendinblue)
  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com', // 👈 Hardcoded to ensure we don't hit Google
    port: 587, // Brevo works best on 587 or 2525
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER, // sohamchaudhary041@gmail.com
      pass: process.env.EMAIL_PASS, // xsmtpsib-....
    },
    tls: {
      rejectUnauthorized: false, // Fix for Render certificate issues
    },
    // Debugging settings
    debug: true,
    logger: true 
  });

  const message = {
    from: `"CliniqueAI Security" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    console.log(`📨 Attempting to send email via Brevo as: ${process.env.EMAIL_USER}`);
    const info = await transporter.sendMail(message);
    console.log("✅ Email sent: %s", info.messageId);
  } catch (error) {
    console.error("❌ Email Error:", error.message);
    // Print full error to see if it's a password issue or connection issue
    console.error(JSON.stringify(error, null, 2));
    throw new Error("Email sending failed");
  }
};

module.exports = sendEmail;