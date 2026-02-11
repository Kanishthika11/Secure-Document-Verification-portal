import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { connectDB } from '@/lib/mongodb';
import User from '@/lib/models/Users';
import Document from '@/lib/models/Document';
import ActivityLog from '@/lib/models/ActivityLog';
import { decryptAES, encryptAES, hashFile, verifySignature } from '@/lib/auth-utils';
import { addVerifiedWatermarkToPdf, isPdfBuffer } from '@/lib/pdf-watermark';

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-change-in-production';

/** Parse AES key from doc and decrypt the document. Used for step 1 and for adding verified stamp on approve. */
async function parseAesKeyAndDecrypt(doc: any, faculty: any): Promise<{ aesKey: Buffer; decryptedFile: Buffer }> {
  const keyString = doc.encryptedAESKey.trim();
  let aesKey: Buffer;

  if (keyString.length === 64 && /^[0-9a-fA-F]{64}$/.test(keyString)) {
    aesKey = Buffer.from(keyString, 'hex');
  } else if (keyString.length > 100 && /^[A-Za-z0-9+/=]+$/.test(keyString)) {
    const encryptedAESKeyBuffer = Buffer.from(keyString, 'base64');
    let decryptedAESKeyBuffer: Buffer | null = null;

    if (faculty.privateKey) {
      try {
        decryptedAESKeyBuffer = crypto.privateDecrypt(
          { key: faculty.privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
          encryptedAESKeyBuffer,
        );
      } catch {
        // try other faculty
      }
    }
    if (!decryptedAESKeyBuffer) {
      const allFaculty = await User.find({ role: 'faculty', privateKey: { $exists: true, $ne: null } });
      for (const other of allFaculty) {
        if (other._id.toString() === faculty._id.toString()) continue;
        try {
          decryptedAESKeyBuffer = crypto.privateDecrypt(
            { key: other.privateKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
            encryptedAESKeyBuffer,
          );
          break;
        } catch {
          continue;
        }
      }
    }
    if (!decryptedAESKeyBuffer) throw new Error('Failed to decrypt AES key');
    aesKey = Buffer.from(decryptedAESKeyBuffer);
  } else {
    throw new Error('Invalid AES key format');
  }
  if (aesKey.length !== 32) throw new Error('AES key must be 32 bytes');

  const encryptedFileBuffer = Buffer.from(doc.encryptedFile, 'base64');
  const decryptedFile = decryptAES(encryptedFileBuffer, aesKey);
  return { aesKey, decryptedFile };
}

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
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 },
      );
    }

    if (decoded.role !== 'faculty') {
      return NextResponse.json(
        { error: 'Only faculty can verify documents' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { documentId, step = 1, action, remarks } = body;

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

    const faculty = await User.findById(decoded.userId);
    if (!faculty) {
      return NextResponse.json(
        { error: 'Faculty not found' },
        { status: 404 },
      );
    }

    const student = await User.findById(doc.studentId);
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 },
      );
    }

    // STEP 1: Verify integrity
    if (step === 1 || step === '1') {
      let integrityStatus = 'UNKNOWN';
      let signatureStatus = 'UNKNOWN';
      let computedHash = '';
      let originalHash = doc.hash;

      try {
        // Check if encryptedAESKey exists and is valid
        if (!doc.encryptedAESKey || doc.encryptedAESKey.trim() === '') {
          console.error(`Document ${documentId} has empty encryptedAESKey`);
          return NextResponse.json(
            {
              error: 'Document is corrupted: missing encryption key. Cannot verify.',
              step: 1,
              integrityStatus: 'FAILED',
              signatureStatus: 'UNKNOWN',
            },
            { status: 400 },
          );
        }

        // Parse AES key - it can be stored in two formats:
        // 1. Plain hex format (64 chars = 32 bytes) - for Next.js frontend uploads
        // 2. RSA-encrypted base64 format (~344 chars) - for backend uploads
        const keyString = doc.encryptedAESKey.trim();

        console.log(`📌 Parsing AES key. Input length: ${keyString.length}, First 20 chars: ${keyString.substring(0, 20)}...`);

        let aesKey: Buffer;

        // Try to detect format and parse accordingly
        if (keyString.length === 64 && /^[0-9a-fA-F]{64}$/.test(keyString)) {
          // Format 1: Plain hex (64 hex characters = 32 bytes)
          console.log('✓ Detected plain hex format AES key');
          aesKey = Buffer.from(keyString, 'hex');
        } else if (keyString.length > 100 && /^[A-Za-z0-9+/=]+$/.test(keyString)) {
          // Format 2: RSA-encrypted base64 (from backend)
          console.log('✓ Detected RSA-encrypted base64 format AES key');

          const encryptedAESKeyBuffer = Buffer.from(keyString, 'base64');
          console.log(`✓ Encrypted AES key buffer size: ${encryptedAESKeyBuffer.length} bytes`);

          let decryptedAESKeyBuffer: Buffer | null = null;

          // Try to decrypt with current faculty's private key first
          if (faculty.privateKey) {
            console.log(`Attempting decryption with current faculty's private key...`);
            try {
              decryptedAESKeyBuffer = crypto.privateDecrypt(
                {
                  key: faculty.privateKey,
                  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                },
                encryptedAESKeyBuffer
              );
              console.log(`✓ Successfully decrypted with current faculty's key`);
            } catch (currentError) {
              console.log(`✗ Current faculty key doesn't match, trying other faculty keys...`);
            }
          } else {
            console.log(`Current faculty has no private key, trying other faculty keys...`);
          }

          // If current faculty didn't work, try all other faculty members
          if (!decryptedAESKeyBuffer) {
            console.log(`Attempting to find correct faculty's private key...`);
            const allFaculty = await User.find({ role: 'faculty', privateKey: { $exists: true, $ne: null } });
            console.log(`Found ${allFaculty.length} faculty members with private keys`);

            for (const otherFaculty of allFaculty) {
              if (otherFaculty._id.toString() === faculty._id.toString()) continue;

              try {
                console.log(`Trying faculty: ${otherFaculty.username}...`);
                decryptedAESKeyBuffer = crypto.privateDecrypt(
                  {
                    key: otherFaculty.privateKey,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                  },
                  encryptedAESKeyBuffer
                );
                console.log(`✓ Successfully decrypted with ${otherFaculty.username}'s key!`);
                console.log(`⚠️  Note: Document was encrypted with ${otherFaculty.username}'s public key`);
                break;
              } catch {
                // Try next faculty
                continue;
              }
            }
          }

          if (!decryptedAESKeyBuffer) {
            throw new Error(
              `Failed to decrypt RSA-encrypted AES key. No matching faculty private key found. ` +
              `This document may have been encrypted with a faculty member who no longer has access to their private key, ` +
              `or the key pair has been compromised.`
            );
          }

          // The decrypted buffer is the AES key (32 bytes from backend)
          aesKey = Buffer.from(decryptedAESKeyBuffer);
          console.log(`✓ Successfully decrypted RSA-encrypted AES key. Result length: ${aesKey.length} bytes`);
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

        console.log(`✓ AES key successfully parsed. Final length: ${aesKey.length} bytes (correct!)`);

        // Decrypt document using AES key
        const encryptedFileBuffer = Buffer.from(doc.encryptedFile, 'base64');
        const decryptedFile = decryptAES(encryptedFileBuffer, aesKey);

        // Compute hash of decrypted file
        computedHash = hashFile(decryptedFile);

        // Verify hash (integrity check)
        integrityStatus = computedHash === originalHash ? 'VALID' : 'FAILED';

        // Verify signature (authenticity check)
        console.log('\n--- 🖋️ SIGNATURE VERIFICATION PROCESS (Faculty) ---');
        console.log(`[Signature] Retrieving Student's Public Key for: ${student.username}`);
        console.log(`[Signature] Verifying digital signature using RSA-SHA256`);
        const signatureValid = verifySignature(decryptedFile, doc.digitalSignature, student.publicKey);
        signatureStatus = signatureValid ? 'VALID' : 'FAILED';
        console.log(`[Signature] Verification Result: ${signatureStatus === 'VALID' ? '✅ AUTHENTIC' : '❌ FAILED'}`);

        // Console logging
        console.log('\n');
        console.log('╔═══════════════════════════════════════════════════════════════════╗');
        console.log('║           🔍 DOCUMENT VERIFICATION PROCESS INITIATED 🔍            ║');
        console.log('╚═══════════════════════════════════════════════════════════════════╝');
        console.log('');
        console.log(`  ├─ Document Name:     ${doc.fileName}`);
        console.log(`  ├─ Document Type:     ${doc.documentType}`);
        console.log(`  ├─ Document ID:       ${documentId}`);
        console.log(`  ├─ Student:           ${student.username} (${student.fullName})`);
        console.log(`  ├─ Faculty:           ${faculty.username} (${faculty.fullName})`);
        console.log(`  ├─ Verification Time: ${new Date().toLocaleString()}`);
        console.log('  │');
        console.log('┌─────────────────────────────────────────────────────────────────┐');
        console.log('│                  🔐 HASH VERIFICATION DETAILS 🔐                  │');
        console.log('├─────────────────────────────────────────────────────────────────┤');
        console.log('│');
        console.log('│  📍 ORIGINAL HASH (Sent by Student):');
        console.log(`│  ${originalHash.substring(0, 65)}`);
        console.log(`│  ${originalHash.substring(65)}`);
        console.log('│');
        console.log('│  🔓 COMPUTED HASH (After Decryption by Faculty):');
        console.log(`│  ${computedHash.substring(0, 65)}`);
        console.log(`│  ${computedHash.substring(65)}`);
        console.log('│');
        console.log('├─────────────────────────────────────────────────────────────────┤');
        console.log(`│  ✓ Integrity Check:  ${integrityStatus === 'VALID' ? '✅ VALID - Document Not Tampered' : '❌ FAILED - Document Tampered!'}`);
        console.log(`│  ✓ Signature Check:  ${signatureStatus === 'VALID' ? '✅ VALID - Authentic Document' : '❌ FAILED - Invalid Signature'}`);
        console.log('│');
        console.log(`│  🔎 FINAL VERDICT:   ${integrityStatus === 'VALID' && signatureStatus === 'VALID' ? '✅ DOCUMENT IS SAFE & AUTHENTIC' : '⚠️ DOCUMENT HAS INTEGRITY ISSUES'}`);
        console.log('└─────────────────────────────────────────────────────────────────┘');
        console.log('');
        console.log('╔═══════════════════════════════════════════════════════════════════╗');
        console.log('');

        return NextResponse.json(
          {
            step: 1,
            documentId,
            fileName: doc.fileName,
            documentType: doc.documentType,
            studentName: student.fullName,
            integrityStatus,
            signatureStatus,
            originalHash,
            computedHash,
            hashMatch: integrityStatus === 'VALID',
            signatureValid: signatureStatus === 'VALID',
            isSafe: integrityStatus === 'VALID' && signatureStatus === 'VALID',
          },
          { status: 200 },
        );
      } catch (cryptoError: any) {
        console.error('Crypto error during verification:', cryptoError);
        return NextResponse.json(
          {
            error: cryptoError.message || 'Error during verification process',
            step: 1,
            integrityStatus: 'UNKNOWN',
            signatureStatus: 'UNKNOWN',
            details: cryptoError.message,
          },
          { status: 500 },
        );
      }
    }

    // STEP 2: Faculty approval/rejection
    else if (step === 2 || step === '2') {
      if (!action || !['approve', 'reject'].includes(action)) {
        return NextResponse.json(
          { error: 'Valid action (approve/reject) required' },
          { status: 400 },
        );
      }

      if (action === 'reject' && !remarks) {
        return NextResponse.json(
          { error: 'Remarks are mandatory for rejection' },
          { status: 400 },
        );
      }

      // On approve: add verified mark (DigiLocker-style) to the document, then re-encrypt
      if (action === 'approve') {
        try {
          const { aesKey, decryptedFile } = await parseAesKeyAndDecrypt(doc, faculty);
          let finalBuffer = decryptedFile;
          if (isPdfBuffer(decryptedFile)) {
            finalBuffer = await addVerifiedWatermarkToPdf(decryptedFile);
          }
          const newEncrypted = encryptAES(finalBuffer, aesKey);
          doc.encryptedFile = newEncrypted.toString('base64');
          doc.hash = hashFile(finalBuffer);
        } catch (stampErr: any) {
          console.error('[verify-document] Failed to add verified stamp:', stampErr);
          // Continue with approve without stamp rather than failing
        }
      }

      doc.status = action === 'approve' ? 'Verified' : 'Rejected';
      doc.verifiedBy = decoded.userId;
      doc.verifiedAt = new Date();
      doc.remarks = remarks || '';

      await doc.save();

      // Log activity
      await ActivityLog.create({
        action: 'DOCUMENT_VERIFICATION',
        userId: decoded.userId,
        resourceId: documentId,
        resourceType: 'document',
        details: {
          action,
          remarks,
          status: doc.status,
        },
      });

      // Console logging
      console.log('\n');
      console.log('╔═══════════════════════════════════════════════════════════════════╗');
      console.log(`║        ${action === 'approve' ? '✅ DOCUMENT APPROVED ✅' : '❌ DOCUMENT REJECTED ❌'}                        ║`);
      console.log('╚═══════════════════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`  ├─ Document Name:     ${doc.fileName}`);
      console.log(`  ├─ Student:           ${student.username}`);
      console.log(`  ├─ Faculty:           ${faculty.username}`);
      console.log(`  ├─ Document ID:       ${documentId}`);
      console.log(`  ├─ Decision Time:     ${new Date().toLocaleString()}`);
      if (remarks) {
        console.log('  │');
        console.log('┌─────────────────────────────────────────────────────────────────┐');
        console.log('│                         FACULTY REMARKS                          │');
        console.log('├─────────────────────────────────────────────────────────────────┤');
        console.log(`│  ${remarks.substring(0, 65)}`);
        for (let i = 65; i < remarks.length; i += 65) {
          console.log(`│  ${remarks.substring(i, i + 65)}`);
        }
        console.log('└─────────────────────────────────────────────────────────────────┘');
      }
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════════════╗');
      console.log('');

      return NextResponse.json(
        {
          step: 2,
          message: `Document ${action}ed successfully`,
          documentId,
          status: doc.status,
          remarks: doc.remarks,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { error: `Invalid step: ${step}` },
      { status: 400 },
    );
  } catch (error: any) {
    console.error('Document verification error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed', details: error.message },
      { status: 500 },
    );
  }
}
