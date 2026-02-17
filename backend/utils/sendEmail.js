const nodemailer = require('nodemailer');
const dns = require('dns');
const util = require('util');

// Promisify the DNS lookup so we can use await
const resolve4 = util.promisify(dns.resolve4);

const sendEmail = async (options) => {
  try {
    // 1. MANUALLY RESOLVE IPV4
    // This forces the code to find an IPv4 address (like 142.250.x.x)
    // and prevents it from ever seeing or trying a broken IPv6 address.
    const ips = await resolve4('smtp.gmail.com');
    const gmailIp = ips[0]; // Grab the first available IPv4 address

    // console.log(`🔍 Resolved Gmail IP to: ${gmailIp}`); // Optional debug

    const transporter = nodemailer.createTransport({
      host: gmailIp, // Connect to the IP directly!
      port: 587,
      secure: false, // TLS
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false,
        // CRITICAL: Since we connect to an IP, we must tell TLS 
        // the actual domain name to verify the certificate.
        servername: 'smtp.gmail.com' 
      },
    });

    const message = {
      from: `"CliniqueAI Support" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await transporter.sendMail(message);
    console.log("✅ Email sent: %s", info.messageId);
  } catch (error) {
    console.error("❌ Email Error:", error.message);
    throw new Error("Email sending failed");
  }
};

module.exports = sendEmail;