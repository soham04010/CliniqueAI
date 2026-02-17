const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use TLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // 👇 THIS IS THE KEY FIX FOR RENDER
    tls: {
      ciphers: 'SSLv3',
    },
    family: 4, // Force IPv4 at transport level
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
    throw new Error("Email sending failed");
  }
};

module.exports = sendEmail;