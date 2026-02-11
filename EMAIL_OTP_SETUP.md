# Send OTP to Gmail (Setup Guide)

The app can send the login OTP to the user's **registered email** instead of printing it in the console. To use your Gmail account for sending:

## 1. Enable 2-Step Verification (if not already)

1. Go to [Google Account Security](https://myaccount.google.com/security).
2. Under "How you sign in to Google", click **2-Step Verification** and turn it on.

## 2. Create a Gmail App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords).
   - If you don’t see it, make sure 2-Step Verification is on.
2. Select app: **Mail**.
3. Select device: **Other (Custom name)** and type e.g. `Secure Portal`.
4. Click **Generate**.
5. Copy the **16-character password** (e.g. `abcd efgh ijkl mnop`). You can paste it with or without spaces.

## 3. Add to your `.env` file

In the **project root** (same folder as `package.json`), create or edit `.env`:

```env
# Your full Gmail address
GMAIL_USER=yourname@gmail.com

# The 16-character App Password (no spaces)
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

Use your real Gmail and the app password you just created. Do **not** use your normal Gmail password.

## 4. Restart the app

Restart the Next.js dev server so it picks up the new env vars:

```bash
npm run dev
```

## 5. Test

1. Register or use an existing user whose **email** is a real address (e.g. your Gmail).
2. Log in with username/password.
3. Check that user’s **inbox** (and spam) for the email with subject **"Your login verification code"**. The OTP is in that email.
4. Enter the OTP on the verify-OTP page to complete login.

## If email is not configured

- OTP is **not** sent by email.
- The server will log the OTP in the **console** (terminal) so you can still test locally.
- The API response message will say OTP was sent; for local dev without Gmail, use the OTP from the console.

## Troubleshooting

- **"Invalid login" / "Username and Password not accepted"** from Gmail  
  - You must use an **App Password**, not your normal Gmail password.
- **No email received**  
  - Check spam/junk.  
  - Ensure `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set in `.env` and the server was restarted.
- **Email not configured**  
  - Ensure `.env` is in the project root and has no typos in `GMAIL_USER` and `GMAIL_APP_PASSWORD`.
