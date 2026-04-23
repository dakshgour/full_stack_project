import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function otpExpiresAt(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) return null;

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
  return transporter;
}

function consoleDivider() {
  return '═'.repeat(58);
}

async function sendEmail({ to, subject, html, otp = null, purpose = 'Email' }) {
  const transport = getTransporter();

  if (!transport) {
    const preview = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    console.log(`\n╔${consoleDivider()}╗`);
    console.log('║           EMAIL (Console Fallback Mode)                ║');
    console.log(`╠${consoleDivider()}╣`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (otp) {
      console.log(`${purpose} OTP: ${otp}`);
    }
    console.log(`Preview: ${preview.slice(0, 140)}`);
    console.log(`╚${consoleDivider()}╝\n`);
    return { accepted: [to], mode: 'console' };
  }

  const info = await transport.sendMail({
    from: env.smtpFrom || env.smtpUser,
    to,
    subject,
    html,
  });

  return { accepted: info.accepted, mode: 'smtp' };
}

export async function sendVerificationEmail(email, otp) {
  return sendEmail({
    to: email,
    subject: 'DSA Visualizer — Verify your email',
    otp,
    purpose: 'Verification',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1a1a2e;color:#e0e0e0;border-radius:12px;">
        <h2 style="color:#58a6ff;margin:0 0 16px;">Email Verification</h2>
        <p>Use the code below to verify your DSA Visualizer account:</p>
        <div style="background:#0d1117;border:2px solid #58a6ff;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#58a6ff;">${otp}</span>
        </div>
        <p style="color:#888;font-size:13px;">This code expires in 10 minutes. If you didn't create an account, ignore this email.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email, otp) {
  return sendEmail({
    to: email,
    subject: 'DSA Visualizer — Password Reset',
    otp,
    purpose: 'Password reset',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#1a1a2e;color:#e0e0e0;border-radius:12px;">
        <h2 style="color:#ffb86b;margin:0 0 16px;">Password Reset</h2>
        <p>Use the code below to reset your password:</p>
        <div style="background:#0d1117;border:2px solid #ffb86b;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
          <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#ffb86b;">${otp}</span>
        </div>
        <p style="color:#888;font-size:13px;">This code expires in 10 minutes. If you didn't request a reset, ignore this email.</p>
      </div>
    `,
  });
}

export { generateOtp, otpExpiresAt };
