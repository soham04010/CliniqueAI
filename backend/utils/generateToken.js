const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    console.error("❌ FATAL ERROR: JWT_SECRET is missing in .env");
    throw new Error("Server Misconfiguration: JWT_SECRET missing");
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

module.exports = generateToken;