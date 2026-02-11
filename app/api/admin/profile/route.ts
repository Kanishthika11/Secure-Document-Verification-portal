import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/Users';

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 },
      );
    }

    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can access their profile' },
        { status: 403 },
      );
    }

    await connectDB();

    const admin = await User.findById(decoded.userId);
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        profile: {
          id: admin._id.toString(),
          fullName: admin.fullName,
          email: admin.email,
          username: admin.username,
          role: admin.role,
          createdAt: admin.createdAt,
          adminId: `ADM${admin._id.toString().slice(0, 8).toUpperCase()}`,
          department: 'Administration',
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve profile' },
      { status: 500 },
    );
  }
}