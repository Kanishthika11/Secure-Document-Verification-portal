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
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 },
      );
    }

    if (decoded.role !== 'faculty') {
      return NextResponse.json(
        { error: 'Only faculty can access assigned documents' },
        { status: 403 },
      );
    }

    await connectDB();

    try {
      // Get all documents sorted by date
      const documents = await Document.find()
        .sort({ createdAt: -1 })
        .lean()
        .maxTimeMS(5000); // 5 second timeout

      if (!documents || documents.length === 0) {
        return NextResponse.json(
          {
            documents: [],
            count: 0,
            pending: 0,
            verified: 0,
            rejected: 0,
          },
          { status: 200 },
        );
      }

      // Fetch student details for all documents
      const formattedDocs = await Promise.all(
        documents.map(async (doc: any) => {
          let studentName = 'Unknown';
          let studentId = null;

          try {
            if (doc.studentId) {
              const student = await User.findById(doc.studentId).select('fullName username email _id').lean();
              if (student) {
                studentName = student.fullName;
                studentId = student._id.toString();
              }
            }
          } catch (err) {
            console.error(`Error fetching student for doc ${doc._id}:`, err);
          }

          return {
            id: doc._id.toString(),
            studentId: studentId,
            studentName: studentName,
            documentType: doc.documentType || 'Unknown',
            fileName: doc.fileName || 'Unnamed',
            status: doc.status || 'Pending',
            uploadedAt: doc.createdAt || new Date(),
            remarks: doc.remarks || '',
            verifiedBy: doc.verifiedBy ? doc.verifiedBy.toString() : null,
            verifiedAt: doc.verifiedAt || null,
          };
        }),
      );

      // Calculate statistics
      const stats = {
        pending: formattedDocs.filter((d: any) => d.status === 'Pending').length,
        verified: formattedDocs.filter((d: any) => d.status === 'Verified').length,
        rejected: formattedDocs.filter((d: any) => d.status === 'Rejected').length,
      };

      return NextResponse.json(
        {
          documents: formattedDocs,
          count: formattedDocs.length,
          ...stats,
        },
        { status: 200 },
      );
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        {
          error: 'Database query failed',
          documents: [],
          count: 0,
          pending: 0,
          verified: 0,
          rejected: 0,
        },
        { status: 200 }, // Return 200 with empty data instead of 500
      );
    }
  } catch (error) {
    console.error('Get assigned documents error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve documents',
        documents: [],
        count: 0,
        pending: 0,
        verified: 0,
        rejected: 0,
      },
      { status: 200 }, // Return 200 with empty data instead of 500
    );
  }
}
