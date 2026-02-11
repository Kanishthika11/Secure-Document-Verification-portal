import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/Users';
import ActivityLog from '@/lib/models/ActivityLog';

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
        { error: 'Only admins can access activity logs' },
        { status: 403 },
      );
    }

    await connectDB();

    // Get activity logs from MongoDB with user details
    const logs = await ActivityLog.find()
      .populate('userId', 'fullName username role')
      .sort({ createdAt: -1 });

    // Format response
    const formattedLogs = logs.map((log: any) => ({
      id: log._id.toString(),
      action: log.action,
      userId: log.userId?._id.toString(),
      userName: log.userId?.fullName || 'Unknown User',
      userRole: log.userId?.role || 'unknown',
      resourceId: log.resourceId,
      resourceType: log.resourceType,
      timestamp: log.createdAt,
      details: log.details,
    }));

    return NextResponse.json(
      {
        logs: formattedLogs,
        totalCount: formattedLogs.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Get activity logs error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve activity logs' },
      { status: 500 },
    );
  }
}
