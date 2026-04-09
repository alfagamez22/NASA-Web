/**
 * Email Service (F4, F14)
 *
 * Uses nodemailer with SMTP. Configure via environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * Falls back to console logging when SMTP_HOST is not set (dev mode).
 */
import nodemailer from "nodemailer";

const isDev = !process.env.SMTP_HOST;

const transporter = isDev
  ? null
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT ?? "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

const fromAddress = process.env.SMTP_FROM ?? "SCC RAN Portal <noreply@scc-ran.local>";

interface SendMailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendMail({ to, subject, text, html }: SendMailOptions) {
  if (isDev || !transporter) {
    console.log(`[EMAIL-DEV] To: ${to} | Subject: ${subject}\n${text}`);
    return;
  }
  await transporter.sendMail({ from: fromAddress, to, subject, text, html });
}

/** Send a 6-digit OTP email */
export async function sendOtpEmail(to: string, otp: string, purpose: "verification" | "password_reset") {
  const purposeLabel = purpose === "verification" ? "Email Verification" : "Password Reset";
  const subject = `SCC RAN Portal — ${purposeLabel} Code`;
  const text = `Your ${purposeLabel.toLowerCase()} code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`;
  const html = `
    <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px">
      <h2 style="color:#1a1a2e">SCC RAN Portal</h2>
      <p>Your <strong>${purposeLabel.toLowerCase()}</strong> code is:</p>
      <div style="font-size:32px;letter-spacing:8px;font-weight:bold;background:#f4f4f8;padding:16px;text-align:center;border-radius:8px;margin:16px 0">${otp}</div>
      <p style="color:#666;font-size:13px">This code expires in 10 minutes. Do not share it with anyone.</p>
    </div>
  `;
  await sendMail({ to, subject, text, html });
}

/** Send a welcome email when an account is created (F14) */
export async function sendWelcomeEmail(to: string, displayName: string, username: string) {
  const subject = "Welcome to SCC RAN Portal";
  const text = `Hello ${displayName},\n\nYour account has been created.\n\nUsername: ${username}\n\nPlease log in and complete your account setup (email verification + password change).`;
  const html = `
    <div style="font-family:sans-serif;max-width:420px;margin:0 auto;padding:24px">
      <h2 style="color:#1a1a2e">Welcome to SCC RAN Portal</h2>
      <p>Hello <strong>${displayName}</strong>,</p>
      <p>Your account has been created.</p>
      <p><strong>Username:</strong> ${username}</p>
      <p>Please log in and complete your account setup (email verification + password change).</p>
    </div>
  `;
  await sendMail({ to, subject, text, html });
}
