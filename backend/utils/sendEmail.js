const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', 
    // FORCE IPv4 to fix the ENETUNREACH error on Render
    family: 4, 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Make sure this is your App Password
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
    // Important: Don't just log, throw so the controller knows it failed
    throw new Error("Email sending failed"); 
  }
};

module.exports = sendEmail;