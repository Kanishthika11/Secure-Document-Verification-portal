# Complete Verification Flow Guide

## System Architecture

```
DOCUMENT UPLOAD
├─ Frontend (Next.js)
│  ├─ POST /api/student/upload-document
│  ├─ AES key: Plain hex (64 chars)
│  └─ Store: encryptedAESKey = aesKey.toString('hex')
│
└─ Backend (Express)
   ├─ POST /student/upload-document
   ├─ AES key: Encrypt with faculty public key
   └─ Store: encryptedAESKey = rsaEncrypted(aesKey).toString('base64')


DOCUMENT VERIFICATION
├─ Faculty clicks "Verify"
│
├─ Step 1: Integrity Check
│  ├─ GET document from DB
│  ├─ Detect key format:
│  │  ├─ If 64 hex chars → Plain format (Next.js)
│  │  │  └─ aesKey = Buffer.from(keyString, 'hex')
│  │  └─ If base64 ~344 chars → RSA-encrypted format (Backend)
│  │     └─ aesKey = crypto.privateDecrypt(faculty.privateKey)
│  │
│  ├─ Decrypt file: decryptedFile = decryptAES(encryptedFile, aesKey)
│  ├─ Compute hash: computedHash = sha256(decryptedFile)
│  ├─ Verify signature: verifySignature(decryptedFile, signature, student.publicKey)
│  └─ Return: { isSafe, hashMatch, signatureValid, ... }
│
├─ Step 2: Faculty Action
│  ├─ Faculty reviews verification results
│  ├─ Enters remarks (optional for approve, required for reject)
│  ├─ Clicks "Approve" or "Reject"
│  └─ Request sent to backend with action + remarks
│
└─ Update & Confirm
   ├─ Update document status (Verified/Rejected)
   ├─ Save faculty info (verifiedBy, verifiedAt, remarks)
   ├─ Log activity
   ├─ Show success modal
   └─ Refresh document list


DOWNLOAD DOCUMENT
├─ Student/Faculty clicks "Download"
├─ GET /api/student/download-document?documentId=xxx
├─ Detect key format (same as verification):
│  ├─ Plain hex → Direct parse
│  └─ RSA-encrypted → Decrypt with user.privateKey
├─ Decrypt file using AES key
└─ Return decrypted file buffer
```

## Step-by-Step Verification Process

### Frontend: Verification Initiation
```javascript
// User clicks "Verify" button on a document
handleVerifyClick(document) {
  setSelectedDocument(document);
  setVerifyStep(1);
  setShowVerificationModal(true);
  performVerification(document.id);  // Call API
}
```

### Backend: Step 1 - Integrity Check
```typescript
POST /api/faculty/verify-document
{
  documentId: "507f1f77bcf86cd799439011",
  step: 1
}

RESPONSE: {
  step: 1,
  documentId: "507f1f77bcf86cd799439011",
  fileName: "degree.pdf",
  studentName: "John Doe",
  integrityStatus: "VALID",      // Hash check result
  signatureStatus: "VALID",      // Signature verification result
  originalHash: "abc123...",
  computedHash: "abc123...",
  hashMatch: true,
  signatureValid: true,
  isSafe: true                    // Overall verdict
}
```

### Frontend: Verification Results Display
```jsx
{/* Shows in Step 2 modal */}
<div className="verification-result">
  <h3>Document Integrity: VALID ✅</h3>
  <div>Hash Check: VALID ✓</div>
  <div>Digital Signature: VALID ✓</div>
  <div>Overall Status: SAFE ✓</div>
</div>

{/* Remarks Input */}
<textarea 
  placeholder="Add notes about the document..."
  value={remarks}
  onChange={(e) => setRemarks(e.target.value)}
/>

{/* Action Buttons */}
<button onClick={() => handleVerifyAction('approve')}>
  ✓ Approve Document
</button>
<button onClick={() => handleVerifyAction('reject')}>
  ✗ Reject Document
</button>
```

### Backend: Step 2 - Faculty Action
```typescript
POST /api/faculty/verify-document
{
  documentId: "507f1f77bcf86cd799439011",
  step: 2,
  action: "approve",            // or "reject"
  remarks: "Document looks good"
}

RESPONSE: {
  step: 2,
  message: "Document approved successfully",
  documentId: "507f1f77bcf86cd799439011",
  status: "Verified",           // or "Rejected"
  remarks: "Document looks good"
}
```

### Database Update
```javascript
// Document record updated:
{
  _id: "507f1f77bcf86cd799439011",
  studentId: "507f1f77bcf86cd799439010",
  fileName: "degree.pdf",
  documentType: "DEGREE_CERT",
  status: "Verified",           // Changed from "Pending"
  verifiedBy: "507f1f77bcf86cd799439012",
  verifiedAt: "2024-02-01T10:30:00.000Z",
  remarks: "Document looks good"
}

// Activity logged:
{
  action: "DOCUMENT_VERIFICATION",
  userId: "507f1f77bcf86cd799439012",
  resourceId: "507f1f77bcf86cd799439011",
  details: {
    action: "approve",
    remarks: "Document looks good",
    status: "Verified"
  }
}
```

### Frontend: Success Confirmation
```jsx
{/* Success Modal Shows */}
<div className="success-modal">
  <div>✅</div>
  <h2>Document Approved Successfully! ✓</h2>
  <p>The document status has been updated and the list will refresh.</p>
</div>

// Auto-dismiss after 2 seconds
// Document list refreshes
// Modal closes
```

## Error Scenarios & Handling

### Scenario 1: Missing Private Key
```
Error: Faculty's private key is missing. Cannot decrypt RSA-encrypted AES key.

Cause: Faculty account created without proper key generation
Solution: Re-register the faculty account or generate keys manually
UI: Show error message in Step 1 modal with explanation
```

### Scenario 2: RSA Decryption Failure
```
Error: Failed to decrypt RSA-encrypted AES key: error details

Cause: Private key doesn't match the public key used for encryption
Solution: Ensure same faculty's key pair used throughout
UI: Show detailed error in Step 1 modal
```

### Scenario 3: Hash Mismatch
```
Result: integrityStatus = "FAILED"
isSafe = false

Cause: Document was modified after upload
Solution: Faculty should reject with explanation
UI: Show red warning, require remarks for rejection
```

### Scenario 4: Signature Invalid
```
Result: signatureStatus = "FAILED"
isSafe = false

Cause: Student's signature doesn't verify with their public key
Solution: Document tampered or signature corrupted
UI: Show red warning, document unsafe
```

## Key Format Detection Algorithm

```typescript
const keyString = doc.encryptedAESKey.trim();

// Check Format 1: Plain Hex
if (keyString.length === 64 && /^[0-9a-fA-F]{64}$/.test(keyString)) {
  // Next.js Frontend Format
  aesKey = Buffer.from(keyString, 'hex');
  console.log('✓ Detected plain hex format AES key');
}

// Check Format 2: RSA-Encrypted Base64
else if (keyString.length > 100 && /^[A-Za-z0-9+/=]+$/.test(keyString)) {
  // Backend API Format
  try {
    encryptedKeyBuffer = Buffer.from(keyString, 'base64');
    decryptedKeyBuffer = crypto.privateDecrypt(
      { key: faculty.privateKey, padding: RSA_PKCS1_OAEP_PADDING },
      encryptedKeyBuffer
    );
    aesKey = Buffer.from(decryptedKeyBuffer);
    console.log('✓ Successfully decrypted RSA-encrypted AES key');
  } catch (error) {
    throw new Error(`Failed to decrypt: ${error.message}`);
  }
}

// Format Unknown
else {
  throw new Error(`Invalid AES key format. Got length: ${keyString.length}`);
}

// Validate Result
if (aesKey.length !== 32) {
  throw new Error(`Invalid key size. Expected 32 bytes, got ${aesKey.length}`);
}
```

## Crypto Operations Timeline

```
UPLOAD (Backend):
1. Generate AES key (32 bytes random)
2. Generate AES IV (16 bytes random)
3. Encrypt file: AES-256-CBC with IV+key
4. Get faculty public key from DB
5. Encrypt AES key: RSA-2048 OAEP with public key
6. Compute hash: SHA-256 of original file
7. Sign hash: RSA with student's private key
8. Store encrypted file + RSA-encrypted key + hash + signature

VERIFY (Faculty):
1. Detect key format
2. If RSA-encrypted:
   a. Get encrypted AES key (base64 ~344 chars)
   b. Decrypt with faculty's private key (RSA OAEP)
   c. Get AES key (32 bytes)
3. Get IV from first 16 bytes of encrypted file
4. Decrypt file: AES-256-CBC with IV+key
5. Compute hash of decrypted file: SHA-256
6. Compare hashes
7. Verify signature: RSA with student's public key
8. Return verdict (isSafe = hashMatch && signatureValid)

DOWNLOAD (Student):
1. Detect key format
2. If RSA-encrypted:
   a. Decrypt with user's private key (RSA OAEP)
   b. Get AES key
3. Get IV from first 16 bytes of encrypted file
4. Decrypt file: AES-256-CBC with IV+key
5. Return decrypted file buffer
```

## Logging & Debugging

### Console Output During Verification

**Success Flow:**
```
📌 Parsing AES key. Input length: 344, First 20 chars: o2sKXe/Rag9S60VCMMBC...
✓ Detected RSA-encrypted base64 format AES key
✓ Faculty private key found. Length: 1704
✓ Encrypted AES key buffer size: 256 bytes
✓ Successfully decrypted RSA-encrypted AES key. Result length: 32 bytes
✓ AES key successfully parsed. Final length: 32 bytes (correct!)

🔍 DOCUMENT VERIFICATION PROCESS INITIATED 🔍
✓ Integrity Check: VALID - Document Not Tampered
✓ Signature Check: VALID - Authentic Document
FINAL VERDICT: DOCUMENT IS SAFE & AUTHENTIC
```

**Error Flow:**
```
📌 Parsing AES key. Input length: 344, First 20 chars: o2sKXe/Rag9S60VCMMBC...
✓ Detected RSA-encrypted base64 format AES key
✓ Faculty private key found. Length: 1704
RSA decryption error details: {
  message: "routines:RSA_padding_check_PKCS1_type_2:pkcs1 ciphertext",
  code: "ERR_OAEP_DECRYPTION_FAILED",
  type: "Error",
  privateKeyPreview: "-----BEGIN PRIVATE KEY-----...",
  encryptedKeyLength: 344
}
Failed to decrypt RSA-encrypted AES key: routines:RSA_padding_check_PKCS1_type_2:pkcs1 ciphertext
```

## Testing Matrix

| Upload Source | Key Format | Detection | Decryption | Verification |
|---|---|---|---|---|
| Next.js Frontend | Hex (64) | ✓ Plain | - | ✓ Works |
| Backend API | RSA Base64 | ✓ RSA | ✓ Works | ✓ Works |
| Corrupted Key | Invalid | ✗ Error | - | ✗ Fails |
| Missing Key | Empty | ✗ Error | - | ✗ Fails |
| Wrong Private Key | RSA Base64 | ✓ RSA | ✗ Error | ✗ Fails |

