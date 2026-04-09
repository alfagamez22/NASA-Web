/**
 * Email Service (F4, F14)
 *
 * Supports two providers (checked in order):
 *   1. Resend  — set RESEND_API_KEY (free tier: 100 emails/day)
 *   2. SMTP    — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * Falls back to console logging when neither is configured (dev mode).
 * Recipients can be any email provider (Gmail, Yahoo, Outlook, etc.).
 */
import nodemailer from "nodemailer";

const RESEND_KEY = process.env.RESEND_API_KEY;
const SMTP_HOST = process.env.SMTP_HOST;

// Resend free-tier uses onboarding@resend.dev; custom domain if verified
const resendFrom = process.env.RESEND_FROM ?? "NASA Portal <onboarding@resend.dev>";
const smtpFrom = process.env.SMTP_FROM ?? "NASA Portal <noreply@nasascc.com>";

const transporter =
  SMTP_HOST
    ? nodemailer.createTransport({
        host: SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT ?? "587", 10),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

async function sendViaResend({ to, subject, text, html }: SendMailOptions) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: [to],
      subject,
      text,
      ...(html ? { html } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

export async function sendMail(options: SendMailOptions) {
  // 1. Resend (preferred — easiest Vercel setup)
  if (RESEND_KEY) {
    await sendViaResend(options);
    return;
  }
  // 2. SMTP
  if (transporter) {
    await transporter.sendMail({ from: smtpFrom, to: options.to, subject: options.subject, text: options.text, html: options.html });
    return;
  }
  // 3. Dev fallback
  console.log(`[EMAIL-DEV] To: ${options.to} | Subject: ${options.subject}\n${options.text}`);
}

/** Send a 6-digit OTP email */
export async function sendOtpEmail(to: string, otp: string, purpose: "verification" | "password_reset") {
  const purposeLabel = purpose === "verification" ? "Email Verification" : "Password Reset";
  const subject = `NASA Portal — ${purposeLabel} Code`;
  const text = `Your ${purposeLabel.toLowerCase()} code is: ${otp}\n\nThis code expires in 15 minutes. Do not share it with anyone.`;
  const html = `
    <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px">
      <h2 style="color:#1a1a2e">NASA Portal</h2>
      <p>Your <strong>${purposeLabel.toLowerCase()}</strong> code is:</p>
      <div style="font-size:32px;letter-spacing:8px;font-weight:bold;background:#f4f4f8;padding:16px;text-align:center;border-radius:8px;margin:16px 0">${otp}</div>
      <p style="color:#666;font-size:13px">This code expires in 15 minutes. Do not share it with anyone.</p>
    </div>
  `;
  await sendMail({ to, subject, text, html });
}

/** Send a welcome email when an account is created (F14) */
export async function sendWelcomeEmail(to: string, displayName: string, username: string) {
  const subject = "Welcome to NASA Portal";
  const text = `Hello ${displayName},\n\nYour account has been created.\n\nUsername: ${username}\n\nPlease log in and complete your account setup (email verification + password change).`;
  const html = `
    <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px">
      <h2 style="color:#1a1a2e">Welcome to NASA Portal</h2>
      <p>Hello <strong>${displayName}</strong>,</p>
      <p>Your account has been created.</p>
      <p><strong>Username:</strong> ${username}</p>
      <p>Please log in and complete your account setup (email verification + password change).</p>
    </div>
  `;
  await sendMail({ to, subject, text, html });
}
