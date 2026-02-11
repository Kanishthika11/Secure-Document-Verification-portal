import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/Users';
import OTPSession from '@/lib/models/OTPSession';
import ActivityLog from '@/lib/models/ActivityLog';
import { generateOTP } from '@/lib/auth-utils';
import { sendOTPEmail, isEmailConfigured } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 },
      );
    }

    await connectDB();

    // Find user in MongoDB
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    // Verify password using bcrypt.compare
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 },
      );
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

    // Store OTP session in MongoDB
    const otpSession = await OTPSession.create({
      userId: user._id,
      otp,
      expiresAt,
      verified: false,
    });

    // Log activity
    await ActivityLog.create({
      action: 'LOGIN_ATTEMPT',
      userId: user._id,
      resourceId: user._id.toString(),
      resourceType: 'user',
      details: {
        username,
        otpGenerated: true,
      },
    });

    // Send OTP to user's registered email
    const emailResult = await sendOTPEmail(user.email, otp, user.fullName);

    if (emailResult.ok) {
      return NextResponse.json(
        {
          message: 'OTP sent to your registered email. Check your inbox.',
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
        },
        { status: 200 },
      );
    }

    // Fallback: if email not configured or send failed, log to console (e.g. development)
    if (!isEmailConfigured()) {
      console.log('\n[OTP] Email not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to .env');
      console.log(`[OTP] For ${username} (${user.email}): ${otp} (valid 2 min)\n`);
    } else {
      console.error('[OTP] Email send failed:', emailResult.error);
    }

    return NextResponse.json(
      {
        message: isEmailConfigured()
          ? 'Could not send OTP email. Please try again or check your email address.'
          : 'OTP sent (check server console if running locally).',
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 },
    );
  }
}