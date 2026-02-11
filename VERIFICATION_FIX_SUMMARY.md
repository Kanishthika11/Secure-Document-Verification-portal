# Document Verification Fix Summary

## Problem
The faculty verification endpoint was failing with error:
```
Failed to decrypt RSA-encrypted AES key. Faculty private key may be incompatible or corrupted.
```

This occurred when documents were uploaded via the backend API which encrypts the AES key with RSA, while the Next.js frontend expected only plain hex-encoded keys.

## Root Cause
**Format Mismatch between two upload sources:**

1. **Next.js Frontend Upload** (`/api/student/upload-document`):
   - Generates AES key
   - Stores it as plain hex (64 characters = 32 bytes)
   - Example: `a1b2c3d4e5f6...` (64 chars)

2. **Backend API Upload** (Express):
   - Generates AES key as base64
   - Encrypts it with faculty's RSA public key
   - Stores as base64-encoded RSA ciphertext (~344 characters)
   - Example: `o2sKXe/Rag9S60VCMMBC1Cg74edcRam1...` (344 chars)

When faculty tried to verify a backend-uploaded document, the verification route couldn't recognize the RSA-encrypted format.

## Solutions Implemented

### 1. Enhanced Key Format Detection
Modified both routes to auto-detect and handle both key formats:

**Location**: 
- `/app/api/faculty/verify-document/route.ts` (lines 104-157)
- `/app/api/student/download-document/route.ts` (lines 67-115)

**Logic**:
```typescript
if (keyString.length === 64 && /^[0-9a-fA-F]{64}$/.test(keyString)) {
  // Plain hex format (Next.js frontend)
  aesKey = Buffer.from(keyString, 'hex');
} else if (keyString.length > 100 && /^[A-Za-z0-9+/=]+$/.test(keyString)) {
  // RSA-encrypted base64 format (Backend API)
  const encryptedAESKeyBuffer = Buffer.from(keyString, 'base64');
  const decryptedAESKeyBuffer = crypto.privateDecrypt({
    key: faculty.privateKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
  }, encryptedAESKeyBuffer);
  aesKey = Buffer.from(decryptedAESKeyBuffer);
}
```

### 2. Improved Error Diagnostics
Added comprehensive error logging to debug RSA decryption failures:

```typescript
if (!faculty.privateKey) {
  throw new Error(`Faculty's private key is missing...`);
}

console.log(`✓ Faculty private key found. Length: ${faculty.privateKey.length}`);
console.log(`✓ Encrypted AES key buffer size: ${encryptedAESKeyBuffer.length} bytes`);

// Detailed error info if decryption fails
catch (rsaError: any) {
  console.error('RSA decryption error details:', {
    message: rsaError.message,
    code: rsaError.code,
    type: rsaError.constructor.name,
    privateKeyPreview: faculty.privateKey?.substring(0, 50),
    encryptedKeyLength: keyString.length,
  });
}
```

### 3. Enhanced UI/UX for Verification Workflow

**Updated `/app/faculty/dashboard/page.tsx`:**

1. **Added Success Modal**:
   - Shows confirmation popup after approve/reject action
   - Auto-dismisses after 2 seconds
   - Updates document list

2. **Better Error Display**:
   - Shows detailed error messages during verification step 1
   - User-friendly error explanations
   - Close button to retry

3. **Verification Flow**:
   - Step 1: Check integrity (displays spinner during verification)
   - Step 1 (Error): Show error message if decryption fails
   - Step 2: Display verification results with hash/signature checks
   - Step 2: Allow approve/reject with remarks
   - Success: Show confirmation popup and refresh list

## Technical Details

### Decryption Process
```
User clicks "Verify" → 
Step 1: API receives documentId → 
- Fetch document from DB
- Detect AES key format (hex vs RSA-encrypted)
- Parse/decrypt AES key accordingly
- Decrypt file using AES key
- Compute file hash and verify signature →
Return verification results with isSafe status →

User clicks "Approve/Reject" →
Step 2: API receives action + remarks →
- Update document status
- Save faculty approval info
- Log activity →
Return success message
```

### Crypto Operations
- **RSA**: PKCS1_OAEP padding (asymmetric)
- **AES**: 256-bit CBC mode (symmetric)
- **Hashing**: SHA-256
- **Signing**: RSA signatures

### Key Validation
- Plain hex: Exactly 64 characters, only [0-9a-fA-F]
- RSA-encrypted: >100 characters, only base64 chars [A-Za-z0-9+/=]

## Files Modified

1. **app/api/faculty/verify-document/route.ts**
   - Added crypto import
   - Enhanced key format detection (lines 104-157)
   - Improved error handling and diagnostics

2. **app/api/student/download-document/route.ts**
   - Added crypto import
   - Enhanced key format detection (lines 67-115)
   - Improved error handling

3. **app/faculty/dashboard/page.tsx**
   - Added successMessage and showSuccessModal state
   - Enhanced error display in verification step 1
   - Added success modal after approval/rejection
   - Auto-refresh documents after action

## Testing Checklist

- [ ] Upload document via Next.js frontend → Verify as faculty
- [ ] Upload document via backend API → Verify as faculty
- [ ] Verify with invalid remarks (for rejection)
- [ ] Check document status updates in list
- [ ] Verify error handling for missing private keys
- [ ] Test with corrupted/mismatched key pairs
- [ ] Check success message displays and dismisses
- [ ] Verify remarks are saved correctly

## Rollback Plan
If issues occur:
1. Revert to previous verify-document route (single format support)
2. Disable backend API uploads until fixed
3. Clear affected documents from database

## Future Improvements
1. Store key encryption method metadata in document schema
2. Support multiple key pair generations for faculty
3. Add key rotation mechanism
4. Implement audit trail for all verification actions
