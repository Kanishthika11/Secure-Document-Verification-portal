import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/Users';
import Document from '@/lib/models/Document';
import ActivityLog from '@/lib/models/ActivityLog';

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let decoded: { id?: string; userId?: string; role?: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id?: string; userId: string; role: string };
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can remove users' },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 },
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    // Only allow removing student and faculty - never admin
    if (user.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot remove admin users' },
        { status: 403 },
      );
    }

    const adminId = decoded.userId ?? decoded.id;

    if (user.role === 'student') {
      // Student: delete all documents uploaded by this student
      await Document.deleteMany({ studentId: userId });
    } else if (user.role === 'faculty') {
      // Faculty: set all documents they verified back to Pending
      await Document.updateMany(
        { verifiedBy: userId },
        {
          $set: {
            status: 'Pending',
            remarks: '',
          },
          $unset: {
            verifiedBy: 1,
            verifiedAt: 1,
          },
        },
      );
    }

    // Log the removal before deleting user
    await ActivityLog.create({
      userId: adminId,
      resourceId: userId,
      resourceType: 'user',
      action: 'User Removed',
      details: { removedUsername: user.username, removedRole: user.role },
    });

    await User.findByIdAndDelete(userId);

    return NextResponse.json(
      { message: 'User removed successfully', removedUserId: userId },
      { status: 200 },
    );
  } catch (error) {
    console.error('Remove user error:', error);
    return NextResponse.json(
      { error: 'Failed to remove user' },
      { status: 500 },
    );
  }
}
