const dotenv = require("dotenv");

dotenv.config(); // loads .env into process.env

module.exports = {
  JWT_SECRET: process.env.JWT_SECRET,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,
  APP_BASE_URL: process.env.APP_BASE_URL,
  PORT: process.env.PORT || 5000,
};

