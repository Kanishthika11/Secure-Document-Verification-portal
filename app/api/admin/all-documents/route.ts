import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/Users';
import Document from '@/lib/models/Document';

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
        { error: 'Only admins can access all documents' },
        { status: 403 },
      );
    }

    await connectDB();

    const allDocs = await Document.find().sort({ createdAt: -1 }).lean();

    const documents = await Promise.all(
      allDocs.map(async (doc: any) => {
        let studentName = 'Unknown';
        try {
          const student = await User.findById(doc.studentId).select('fullName').lean();
          if (student) studentName = student.fullName;
        } catch (err) {
          console.error(`Error fetching student for doc ${doc._id}:`, err);
        }

        return {
          id: doc._id.toString(),
          studentName,
          fileName: doc.fileName || 'Unnamed',
          documentType: doc.documentType || 'Unknown',
          status: doc.status || 'Pending',
          uploadedAt: doc.createdAt || new Date(),
          remarks: doc.remarks || '',
          verifiedBy: doc.verifiedBy ? doc.verifiedBy.toString() : null,
        };
      }),
    );

    return NextResponse.json(
      {
        documents,
        count: documents.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Get all documents error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve documents',
        documents: [],
      },
      { status: 200 },
    );
  }
}