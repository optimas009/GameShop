const dns = require("dns").promises;
const crypto = require("crypto");

async function hasMxRecord(email) {
  try {
    const domain = email.split("@")[1];
    if (!domain) return false;

    const records = await dns.resolveMx(domain);
    return Array.isArray(records) && records.length > 0;
  } catch {
    return false;
  }
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function hashOtp(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

module.exports = { hasMxRecord, generateOtpCode, hashOtp };
