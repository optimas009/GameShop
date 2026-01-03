const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ sendVerificationEmail now sends a code, not a link
async function sendVerificationEmail(toEmail, code) {
  return transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: "Your GameShop verification code",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Email Verification</h2>
        <p>Use this verification code to verify your email:</p>
        <div style="
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 6px;
          padding: 12px 18px;
          background: #111;
          color: #fff;
          display: inline-block;
          border-radius: 8px;
        ">
          ${code}
        </div>
        <p style="margin-top: 16px;">This code will expire in 60 minutes.</p>
      </div>
    `,
  });
}

module.exports = { sendVerificationEmail };
