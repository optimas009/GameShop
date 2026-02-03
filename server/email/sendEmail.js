const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true only for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendVerificationEmail(toEmail, code) {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: "Your GameVault verification code",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Email Verification</h2>
        <p>Your verification code:</p>
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
        <p style="margin-top: 16px;">
          This code expires in 5 minutes.
        </p>
      </div>
    `,
  });
}

async function sendResetPasswordEmail(toEmail, code) {
  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: "GameVault password reset code",
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h2>Password Reset</h2>
        <p>Your reset code:</p>
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
        <p style="margin-top: 16px;">
          This code expires in 5 minutes.
        </p>
      </div>
    `,
  });
}

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail,
};
