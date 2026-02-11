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

        let decoded: any;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        if (decoded.role !== 'student') {
            return NextResponse.json({ error: 'Only students can delete their documents' }, { status: 403 });
        }

        const { documentId } = await request.json();
        if (!documentId) {
            return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
        }

        await connectDB();

        const doc = await Document.findById(documentId);
        if (!doc) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        // Ensure student owns the document
        if (doc.studentId.toString() !== decoded.userId) {
            return NextResponse.json({ error: 'Unauthorized to delete this document' }, { status: 403 });
        }

        // Only allow deletion of Pending or Rejected documents? 
        // Or allow any? Usually, once verified it might be permanent, 
        // but the user asked for "case if they have uploaded a wrong file".
        // Let's allow any for now as requested.

        await Document.findByIdAndDelete(documentId);

        // Log the deletion
        await ActivityLog.create({
            action: 'DOCUMENT_DELETE',
            userId: decoded.userId,
            resourceId: documentId,
            resourceType: 'document',
            details: {
                fileName: doc.fileName,
                documentType: doc.documentType,
            },
        });

        return NextResponse.json({ message: 'Document removed successfully' }, { status: 200 });
    } catch (error: any) {
        console.error('Delete document error:', error);
        return NextResponse.json({ error: 'Failed to delete document', details: error.message }, { status: 500 });
    }
}
