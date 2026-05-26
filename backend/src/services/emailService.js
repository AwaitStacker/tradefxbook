// src/services/emailService.js
// Supports two providers based on env vars:
//   1. Resend  — set RESEND_API_KEY
//   2. Gmail SMTP — set GMAIL_USER + GMAIL_APP_PASSWORD (no domain needed)
// Falls back to console log in development if neither is configured.

let _transporter = null;
let _resend      = null;

function getProvider() {
  // Resend takes priority if key is set
  if (process.env.RESEND_API_KEY &&
      process.env.RESEND_API_KEY !== "re_XXXXXXXXXXXXXXXXXXXXXXXX") {
    if (!_resend) {
      const { Resend } = require("resend");
      _resend = new Resend(process.env.RESEND_API_KEY);
    }
    return "resend";
  }
  // Gmail SMTP second option
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    if (!_transporter) {
      const nodemailer = require("nodemailer");
      _transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      });
    }
    return "gmail";
  }
  return "console";
}

async function sendEmail({ to, subject, html }) {
  const provider = getProvider();

  if (provider === "resend") {
    const from = process.env.EMAIL_FROM || "TradeFXBook <onboarding@resend.dev>";
    await _resend.emails.send({ from, to, subject, html });
    console.log(`📨 Email sent via Resend to ${to}`);
    return;
  }

  if (provider === "gmail") {
    const from = process.env.GMAIL_USER;
    await _transporter.sendMail({ from, to, subject, html });
    console.log(`📨 Email sent via Gmail to ${to}`);
    return;
  }

  // Console fallback — dev mode only
  console.log(`\n📧 EMAIL NOT SENT (no provider configured)`);
  console.log(`   To:      ${to}`);
  console.log(`   Subject: ${subject}`);
}

const emailService = {
  sendOTP: async (toEmail, name, otp) => {
    await sendEmail({
      to:      toEmail,
      subject: `${otp} — Your TradeFXBook verification code`,
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;
                    background:#0a0a0f;color:#f1f5f9;border-radius:12px">
          <h2 style="margin:0 0 8px">📊 TradeFXBook</h2>
          <p style="color:#94a3b8;margin:0 0 24px">Hi ${name}, verify your email.</p>
          <div style="background:#111120;border:1px solid #3b82f633;border-radius:10px;
                      padding:24px;text-align:center;margin-bottom:24px">
            <div style="font-size:11px;color:#64748b;letter-spacing:2px;margin-bottom:8px">
              VERIFICATION CODE
            </div>
            <div style="font-size:40px;font-weight:800;letter-spacing:10px;color:#3b82f6">
              ${otp}
            </div>
            <div style="font-size:12px;color:#64748b;margin-top:8px">Expires in 10 minutes</div>
          </div>
          <p style="font-size:13px;color:#475569">
            If you didn't create a TradeFXBook account, ignore this email.
          </p>
        </div>`,
    });
  },

  sendPasswordReset: async (toEmail, name, resetUrl) => {
    await sendEmail({
      to:      toEmail,
      subject: "Reset your TradeFXBook password",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;
                    background:#0a0a0f;color:#f1f5f9;border-radius:12px">
          <h2 style="margin:0 0 8px">📊 TradeFXBook</h2>
          <p style="color:#94a3b8;margin:0 0 24px">Hi ${name}, reset your password.</p>
          <a href="${resetUrl}"
             style="display:block;background:linear-gradient(135deg,#3b82f6,#1d4ed8);
                    color:#fff;text-decoration:none;text-align:center;padding:14px 24px;
                    border-radius:10px;font-weight:700;font-size:15px;margin-bottom:20px">
            Reset Password →
          </a>
          <p style="font-size:12px;color:#475569">Expires in 1 hour. One-time use only.</p>
          <p style="font-size:11px;color:#334155;word-break:break-all">Or copy: ${resetUrl}</p>
        </div>`,
    });
  },
};

module.exports = emailService;