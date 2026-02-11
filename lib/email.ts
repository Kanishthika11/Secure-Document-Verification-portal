import nodemailer from 'nodemailer';

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

/**
 * Check if Gmail is configured (so we can send OTP via email).
 */
export function isEmailConfigured(): boolean {
  return Boolean(GMAIL_USER && GMAIL_APP_PASSWORD);
}

/**
 * Send OTP to the user's registered email via Gmail SMTP.
 * Requires GMAIL_USER and GMAIL_APP_PASSWORD in .env.
 * @see .env.example for setup (Gmail App Password)
 */
export async function sendOTPEmail(to: string, otp: string, userName?: string): Promise<{ ok: boolean; error?: string }> {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    return { ok: false, error: 'Email not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env' };
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD,
    },
  });

  const displayName = userName || 'User';
  const html = `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Secure Document Portal</h2>
      <p>Hi ${displayName},</p>
      <p>Your one-time password (OTP) for login is:</p>
      <p style="font-size: 24px; letter-spacing: 4px; font-weight: bold; background: #f0f0f0; padding: 12px 16px; border-radius: 8px;">${otp}</p>
      <p style="color: #666; font-size: 14px;">This code expires in 2 minutes. Do not share it with anyone.</p>
      <p style="color: #666; font-size: 12px;">If you did not request this, please ignore this email.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"Secure Document Portal" <${GMAIL_USER}>`,
      to,
      subject: 'Your login verification code',
      text: `Your OTP is: ${otp}. Valid for 2 minutes.`,
      html,
    });
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send email';
    console.error('[EMAIL] Send OTP failed:', message);
    return { ok: false, error: message };
  }
}
