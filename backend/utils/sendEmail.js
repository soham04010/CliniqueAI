const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Use specific SMTP settings instead of the 'service' shortcut
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,                 // Standard port for modern email sending
    secure: false,             // false for port 587 (uses STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      ciphers: 'SSLv3',        // Helps compatibility
      rejectUnauthorized: false // (Optional) Helps if certificates are fussy
    },
    // Explicitly force IPv4 here as well
    family: 4, 
  });

  const message = {
    from: `"CliniqueAI Support" <${process.env.EMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log("✅ Email sent: %s", info.messageId);
  } catch (error) {
    console.error("❌ Email Error:", error.message); 
    // Throw error so your frontend knows it failed
    throw new Error("Email sending failed");
  }
};

module.exports = sendEmail;