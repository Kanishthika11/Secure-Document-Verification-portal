import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/Users';
import Document from '@/lib/models/Document';
import ActivityLog from '@/lib/models/ActivityLog';
import { decryptAES, hashFile } from '@/lib/auth-utils';

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

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID required' },
        { status: 400 },
      );
    }

    await connectDB();

    const doc = await Document.findById(documentId);
    if (!doc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 },
      );
    }

    // Check authorization - student can only download their own documents
    if (decoded.role === 'student' && doc.studentId.toString() !== decoded.userId) {
      return NextResponse.json(
        { error: 'Unauthorized to download this document' },
        { status: 403 },
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 },
      );
    }

    try {
      let decryptedFile: Buffer;

      // Parse AES key - it can be stored in two formats:
      // 1. Plain hex format (64 chars = 32 bytes) - for Next.js frontend uploads
      // 2. RSA-encrypted base64 format (~344 chars) - for backend uploads
      const keyString = doc.encryptedAESKey.trim();

      console.log(`📌 Parsing AES key for download. Input length: ${keyString.length}`);

      let aesKey: Buffer;

      // Try to detect format and parse accordingly
      if (keyString.length === 64 && /^[0-9a-fA-F]{64}$/.test(keyString)) {
        // Format 1: Plain hex (64 hex characters = 32 bytes)
        console.log('✓ Detected plain hex format AES key');
        aesKey = Buffer.from(keyString, 'hex');
      } else if (keyString.length > 100 && /^[A-Za-z0-9+/=]+$/.test(keyString)) {
        // Format 2: RSA-encrypted base64 (from backend)
        console.log('✓ Detected RSA-encrypted base64 format AES key');
        try {
          // Decrypt the RSA-encrypted AES key
          const encryptedAESKeyBuffer = Buffer.from(keyString, 'base64');

          let decryptedAESKeyBuffer: Buffer | null = null;

          // Try to decrypt with user's own private key first
          if (user.privateKey) {
            console.log(`Attempting decryption with user's private key...`);
            try {
              decryptedAESKeyBuffer = crypto.privateDecrypt(
                {
                  key: user.privateKey,
                  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                },
                encryptedAESKeyBuffer
              );
              console.log(`✓ Successfully decrypted with user's key`);
            } catch (userError) {
              console.log(`✗ User's key doesn't match. Document may be encrypted with faculty's public key.`);

              // Document may be encrypted with a faculty member's public key (Key Exchange)
              // We try all faculty keys to see if one can decrypt it
              console.log(`Attempting to find correct faculty's private key to help with decryption...`);
              const allFaculty = await User.find({ role: 'faculty', privateKey: { $exists: true, $ne: null } });

              for (const faculty of allFaculty) {
                try {
                  console.log(`Trying faculty key: ${faculty.username}...`);
                  decryptedAESKeyBuffer = crypto.privateDecrypt(
                    {
                      key: faculty.privateKey,
                      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    },
                    encryptedAESKeyBuffer
                  );
                  console.log(`✓ Successfully decrypted with ${faculty.username}'s key!`);
                  break;
                } catch {
                  continue;
                }
              }
            }
          }

          if (!decryptedAESKeyBuffer) {
            throw new Error(
              `Failed to decrypt RSA-encrypted AES key. No matching private key found.`
            );
          }

          // The decrypted buffer is the AES key
          aesKey = Buffer.from(decryptedAESKeyBuffer);
          console.log(`✓ Successfully decrypted RSA-encrypted AES key`);
        } catch (rsaError: any) {
          console.error('Failed to decrypt RSA-encrypted AES key:', rsaError.message);
          throw new Error(
            `Failed to decrypt RSA-encrypted AES key. ${rsaError.message}`
          );
        }
      } else {
        throw new Error(
          `Invalid AES key format. Expected either 64 hex characters or base64-encoded RSA-encrypted data. ` +
          `Got length: ${keyString.length}. Key preview: ${keyString.substring(0, 32)}...`
        );
      }

      if (aesKey.length !== 32) {
        throw new Error(
          `Failed to parse AES key correctly. Expected 32 bytes, got ${aesKey.length} bytes.`
        );
      }

      console.log(`✓ AES key successfully parsed for download. Length: ${aesKey.length} bytes`);

      if (decoded.role === 'faculty') {
        // Faculty can download and decrypt
        const encryptedFileBuffer = Buffer.from(doc.encryptedFile, 'base64');
        decryptedFile = decryptAES(encryptedFileBuffer, aesKey);
      } else if (decoded.role === 'student') {
        // Students can only download when document status is Verified
        if (doc.status !== 'Verified') {
          return NextResponse.json(
            { error: doc.status === 'Pending' ? 'Document still pending review' : 'Only verified documents can be downloaded' },
            { status: 403 },
          );
        }
        // For students, decrypt the file
        const encryptedFileBuffer = Buffer.from(doc.encryptedFile, 'base64');
        decryptedFile = decryptAES(encryptedFileBuffer, aesKey);
      } else {
        return NextResponse.json(
          { error: 'Unauthorized to download this document' },
          { status: 403 },
        );
      }

      // Verify integrity before sending
      const computedHash = hashFile(decryptedFile);
      if (computedHash !== doc.hash) {
        console.warn(`Hash mismatch for document ${documentId}`);
        return NextResponse.json(
          { error: 'Document integrity check failed - file may be corrupted' },
          { status: 400 },
        );
      }

      // Log download activity
      await ActivityLog.create({
        action: 'DOCUMENT_DOWNLOAD',
        userId: decoded.userId,
        resourceId: documentId,
        resourceType: 'document',
        details: {
          fileName: doc.fileName,
          documentType: doc.documentType,
          status: doc.status,
        },
      });

      // Convert Buffer to Uint8Array for NextResponse
      const fileData = new Uint8Array(decryptedFile);

      const requestedFileName = doc.fileName || doc.documentType?.replace(/_/g, '-') || 'document';
      const finalFileName = requestedFileName.toLowerCase().endsWith('.pdf') ? requestedFileName : `${requestedFileName}.pdf`;

      return new NextResponse(fileData, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${finalFileName}"`,
          'Content-Length': fileData.length.toString(),
        },
      });
    } catch (cryptoError: any) {
      console.error('Decryption error:', cryptoError);
      return NextResponse.json(
        { error: 'Failed to decrypt document', details: cryptoError.message },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Download failed', details: error.message },
      { status: 500 },
    );
  }
}