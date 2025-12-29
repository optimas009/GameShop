const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendVerificationEmail(toEmail, verifyLink) {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Verify your email",
    html: `
      <h2>Email Verification</h2>
      <p>Click this link to verify your email:</p>
      <a href="${verifyLink}">${verifyLink}</a>
    `
  });
}

module.exports = { sendVerificationEmail };
