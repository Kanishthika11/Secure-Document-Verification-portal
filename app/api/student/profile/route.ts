import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/Users';

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';

export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
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

    // Check role
    if (decoded.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can access their profile' },
        { status: 403 },
      );
    }

    await connectDB();

    // Get student user from MongoDB
    const student = await User.findById(decoded.userId);
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        profile: {
          id: student._id.toString(),
          fullName: student.fullName,
          email: student.email,
          username: student.username,
          role: student.role,
          createdAt: student.createdAt,
          studentId: `STU${student._id.toString().slice(0, 8).toUpperCase()}`,
          department: 'Computer Science',
          registrationNumber: `REG${Math.floor(Math.random() * 100000)}`,
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
