const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    // "service: gmail" automatically sets host, port 465, and secure: true
    service: 'gmail', 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // MUST be an App Password
    },
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
    console.error("❌ Email Error:", error);
    // Throwing error allows the controller to handle the failure (e.g. return 500)
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;