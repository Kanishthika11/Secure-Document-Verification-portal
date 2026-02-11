import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/Users';
import OTPSession from '@/lib/models/OTPSession';
import ActivityLog from '@/lib/models/ActivityLog';

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, otp } = body;

    if (!userId || !otp) {
      return NextResponse.json(
        { error: 'User ID and OTP required' },
        { status: 400 },
      );
    }

    await connectDB();

    // Get OTP session
    const otpSession = await OTPSession.findOne({ userId, verified: false });
    if (!otpSession) {
      return NextResponse.json(
        { error: 'OTP session not found' },
        { status: 401 },
      );
    }

    // Check OTP expiration
    if (new Date() > otpSession.expiresAt) {
      await OTPSession.deleteOne({ _id: otpSession._id });
      return NextResponse.json(
        { error: 'OTP expired' },
        { status: 401 },
      );
    }

    // Verify OTP
    if (otpSession.otp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 401 },
      );
    }

    // Mark OTP as verified
    otpSession.verified = true;
    await otpSession.save();

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
      JWT_SECRET,
      { expiresIn: '24h' },
    );

    // Log activity
    await ActivityLog.create({
      action: 'LOGIN_SUCCESS',
      userId: user._id,
      resourceId: user._id.toString(),
      resourceType: 'user',
      details: {
        role: user.role,
        timestamp: new Date(),
      },
    });

    // Delete OTP session
    await OTPSession.deleteOne({ _id: otpSession._id });

    return NextResponse.json(
      {
        message: 'OTP verified successfully',
        token,
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 },
    );
  }
}
