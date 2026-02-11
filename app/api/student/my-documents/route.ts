import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/Users';
import Document from '@/lib/models/Document';

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
        { error: 'Only students can access their documents' },
        { status: 403 },
      );
    }

    await connectDB();

    // Verify student exists
    const student = await User.findById(decoded.userId);
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 },
      );
    }

    // Get student documents from MongoDB
    const studentDocs = await Document.find({ studentId: decoded.userId }).sort({ createdAt: -1 });

    // Format response
    const formattedDocs = studentDocs.map((doc) => ({
      id: doc._id.toString(),
      fileName: doc.fileName,
      documentType: doc.documentType,
      status: doc.status,
      uploadedAt: doc.createdAt,
      remarks: doc.remarks,
      verifiedBy: doc.verifiedBy?.toString(),
      verifiedAt: doc.verifiedAt,
    }));

    return NextResponse.json(
      {
        documents: formattedDocs,
        count: formattedDocs.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve documents' },
      { status: 500 },
    );
  }
}
