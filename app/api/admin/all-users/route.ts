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
    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can access user list' },
        { status: 403 },
      );
    }

    await connectDB();

    // Get all users from MongoDB
    const allUsers = await User.find().select('-password -privateKey').sort({ createdAt: -1 });

    // Format response
    const formattedUsers = allUsers.map((user) => ({
      id: user._id.toString(),
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    }));

    // Count by role
    const roleCount = {
      students: formattedUsers.filter((u) => u.role === 'student').length,
      faculty: formattedUsers.filter((u) => u.role === 'faculty').length,
      admins: formattedUsers.filter((u) => u.role === 'admin').length,
    };

    return NextResponse.json(
      {
        users: formattedUsers,
        totalCount: formattedUsers.length,
        roleCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve users' },
      { status: 500 },
    );
  }
}
