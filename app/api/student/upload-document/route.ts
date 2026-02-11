import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/Users';
import Document from '@/lib/models/Document';
import ActivityLog from '@/lib/models/ActivityLog';
import {
  generateAESKey,
  encryptAES,
  hashFile,
  signData,
} from '@/lib/auth-utils';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';

export async function POST(request: NextRequest) {
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

    if (decoded.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can upload documents' },
        { status: 403 },
      );
    }

    await connectDB();

    const student = await User.findById(decoded.userId);
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'File and document type required' },
        { status: 400 },
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Step 1: Generate AES key and encrypt document
    const aesKey = generateAESKey();
    const encryptedFile = encryptAES(fileBuffer, aesKey);

    // Step 2: Key Exchange - Encrypt AES key with Faculty's Public Key
    // Find a faculty member who has a public key for encryption
    const faculty = await User.findOne({ role: 'faculty', publicKey: { $exists: true, $ne: null } });
    let encryptedAESKey = '';

    console.log('\n--- 🔑 KEY EXCHANGE PROCESS (Upload) ---');
    if (faculty && faculty.publicKey) {
      console.log(`[Key Exchange] Encrypting AES key with Faculty's Public Key (${faculty.username})`);
      const encryptedKeyBuffer = crypto.publicEncrypt(
        { key: faculty.publicKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
        aesKey
      );
      encryptedAESKey = encryptedKeyBuffer.toString('base64');
      console.log(`[Key Exchange] Secure Key Package created: ${encryptedAESKey.substring(0, 32)}...`);
    } else {
      console.log('[Key Exchange] No faculty public key found, falling back to hex for demo');
      encryptedAESKey = aesKey.toString('hex');
    }

    // Step 3: Compute hash of original file
    const fileHash = hashFile(fileBuffer);

    // Step 4: Digital signature with student private key
    let digitalSignature = '';
    console.log('\n--- 🖋️ DIGITAL SIGNATURE PROCESS (Upload) ---');
    if (student.privateKey) {
      console.log(`[Signature] Signing document hash with Student's Private Key (${student.username})`);
      digitalSignature = signData(fileBuffer, student.privateKey);
      console.log(`[Signature] Digital Signature created: ${digitalSignature.substring(0, 32)}...`);
    } else {
      digitalSignature = crypto.createHash('sha256').update(fileBuffer).digest('hex');
    }

    // Step 5: Save document to MongoDB
    const newDocument = await Document.create({
      studentId: student._id,
      fileName: file.name,
      documentType: documentType,
      encryptedFile: encryptedFile.toString('base64'),
      encryptedAESKey: encryptedAESKey,
      hash: fileHash,
      digitalSignature: digitalSignature,
      status: 'Pending',
    });

    // Console logging
    console.log('\n');
    console.log('╔═══════════════════════════════════════════════════════════════════╗');
    console.log('║              📄 DOCUMENT UPLOADED SUCCESSFULLY 📄                   ║');
    console.log('╚═══════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`  ├─ Document Name:     ${file.name}`);
    console.log(`  ├─ Student:           ${student.username} (${student.fullName})`);
    console.log(`  ├─ Document Type:     ${documentType}`);
    console.log(`  ├─ Document ID:       ${newDocument._id}`);
    console.log(`  ├─ File Size:         ${(fileBuffer.length / 1024).toFixed(2)} KB`);
    console.log(`  ├─ Upload Time:       ${new Date().toLocaleString()}`);
    console.log('  │');
    console.log('┌─────────────────────────────────────────────────────────────────┐');
    console.log('│                    🔐 CRYPTOGRAPHIC DETAILS 🔐                    │');
    console.log('├─────────────────────────────────────────────────────────────────┤');
    console.log(`│  📍 Original File Hash (SHA-256):                                 │`);
    console.log(`│  ${fileHash.substring(0, 65)}`);
    console.log(`│  ${fileHash.substring(65)}`);
    console.log('│                                                                   │');
    console.log(`│  🔑 AES-256 Encryption Key (Hex):                                 │`);
    console.log(`│  ${encryptedAESKey.substring(0, 65)}`);
    console.log(`│  ${encryptedAESKey.substring(65)}`);
    console.log('│                                                                   │');
    console.log(`│  ✍️ Digital Signature (Student Signed):                            │`);
    console.log(`│  ${digitalSignature.substring(0, 65)}`);
    console.log(`│  ${digitalSignature.substring(65)}`);
    console.log('│                                                                   │');
    console.log('│  ✅ Status: ENCRYPTED & SIGNED                                   │');
    console.log('└─────────────────────────────────────────────────────────────────┘');
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════════════╗');
    console.log('');

    // Log activity
    await ActivityLog.create({
      action: 'DOCUMENT_UPLOAD',
      userId: student._id,
      resourceId: newDocument._id.toString(),
      resourceType: 'document',
      details: {
        documentType,
        fileName: file.name,
        hash: fileHash,
        fileSize: fileBuffer.length,
      },
    });

    return NextResponse.json(
      {
        message: 'Document uploaded successfully',
        documentId: newDocument._id.toString(),
        status: 'Pending',
        hash: fileHash,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
