# Verification System Verification Checklist

## Pre-Testing Setup
- [ ] Start Next.js frontend: `npm run dev`
- [ ] Backend is running (if testing backend uploads)
- [ ] MongoDB is connected
- [ ] Faculty and Student accounts are registered

## Unit Test: Frontend Upload & Verification

### Test 1: Basic Upload
```
Steps:
1. Login as student
2. Go to upload page
3. Select document and type (e.g., MARK_SHEET)
4. Upload document
Expected: Upload succeeds, document appears in pending list
```

### Test 2: Faculty Verification - Frontend Uploaded Doc
```
Steps:
1. Login as faculty
2. View pending documents
3. Click "Verify" on a document uploaded via frontend
Expected Results:
  ✓ Step 1: Shows spinner "Verifying document..."
  ✓ Step 2: Shows verification results with:
    - Document name and student name
    - Hash Check: VALID ✓
    - Digital Signature: VALID ✓
    - Overall Status: SAFE ✓
  ✓ Can enter remarks (optional)
  ✓ Can click "Approve Document"
  ✓ Success modal shows
  ✓ Document list refreshes
  ✓ Document status changes to "Verified"
```

### Test 3: Faculty Rejection
```
Steps:
1. Login as faculty
2. Click "Verify" on a different document
3. Review results
4. Click "Reject Document"
5. Enter remarks: "Document quality is poor"
Expected Results:
  ✓ Remarks field is required (disabled button if empty)
  ✓ After reject: Success modal shows
  ✓ Document status changes to "Rejected"
  ✓ Remarks are saved
```

## Unit Test: Backend Upload & Verification

### Test 4: Backend API Upload (Express)
```
Pre-requisite: Backend server running

Using curl or Postman:
POST http://localhost:5000/api/student/upload-document
Headers: Authorization: Bearer <token>
Body: 
  - documentType: "Mark Sheets"
  - fileContent: <base64 encoded file>

Expected: 
  ✓ Document created with RSA-encrypted AES key
  ✓ Key length ~344 characters
  ✓ Key is base64-encoded
```

### Test 5: Faculty Verification - Backend Uploaded Doc
```
Steps:
1. Login as faculty (same one from backend data)
2. View pending documents
3. Click "Verify" on the backend-uploaded document
Expected Results:
  ✓ Step 1: Shows spinner
  ✓ Console logs show: "✓ Detected RSA-encrypted base64 format AES key"
  ✓ Console logs show: "✓ Successfully decrypted RSA-encrypted AES key"
  ✓ Step 2: Shows verification results (should be VALID if not tampered)
  ✓ Faculty can approve/reject normally
  ✓ Success modal shows
  ✓ Document list updates
```

## Error Case Testing

### Test 6: Missing Private Key Error
```
Simulate Error: Create a document with RSA-encrypted key, but no private key in faculty record

Steps:
1. Database: Set faculty.privateKey = null for a faculty
2. Upload document via backend (uses that faculty's public key)
3. Login as that faculty
4. Click "Verify"

Expected:
  ✓ Step 1 modal shows loading spinner briefly
  ✓ Error message displays: "Faculty's private key is missing..."
  ✓ Close button shown
  ✓ Can retry or cancel
  ✓ No crash or blank screen
```

### Test 7: Key Mismatch Error
```
Simulate Error: Document encrypted with Faculty A's public key, but Faculty B tries to verify

Steps:
1. Upload via backend using Faculty A's public key
2. Login as Faculty B
3. Click "Verify"

Expected:
  ✓ Step 1: Shows loading spinner
  ✓ Error message displays: "Failed to decrypt RSA-encrypted AES key..."
  ✓ Detailed error info in console
  ✓ User-friendly message: "Faculty may need to re-register..."
  ✓ Can close modal
```

### Test 8: Hash Mismatch Error
```
Simulate Error: Manually modify document data to cause hash mismatch

Expected:
  ✓ Step 1: Verification completes
  ✓ Step 2: Shows "Document Integrity: INVALID ❌"
  ✓ Hash Check: FAILED ✗
  ✓ isSafe: false
  ✓ Rejection is only option
  ✓ Remarks become required
```

### Test 9: Invalid Signature Error
```
Simulate Error: Modify signature field in database

Expected:
  ✓ Step 1: Verification completes
  ✓ Step 2: Shows Digital Signature: FAILED ✗
  ✓ isSafe: false
  ✓ Overall Status: TAMPERED ✗
  ✓ Only reject option available
```

## UI/UX Testing

### Test 10: Modal Flow
```
Verify modal behavior:
1. Click Verify → Modal opens with spinner
2. Wait for results → Modal transitions to results view
3. Enter remarks → State updates correctly
4. Click Approve → Buttons disable, loading shows
5. Success modal appears → Auto-dismisses after 2 seconds
6. Main list refreshed → New status shows

Expected: Smooth transitions, no blank screens, proper loading states
```

### Test 11: Error Message Display
```
Verify error messages are clear:
1. Missing private key → Explains solution
2. RSA decryption failure → Suggests re-registration
3. Invalid remarks → Clear validation message
4. Network error → Handled gracefully

Expected: User can understand what went wrong and how to fix it
```

### Test 12: Data Persistence
```
Verify data is saved correctly:
1. After approval:
   - Document status = "Verified" ✓
   - verifiedBy = faculty ID ✓
   - verifiedAt = current timestamp ✓
   - remarks = entered text ✓

2. After rejection:
   - Document status = "Rejected" ✓
   - Remarks saved ✓
   - Activity logged ✓

3. On refresh:
   - Status persists ✓
   - Can't verify again (button disabled) ✓
```

## Performance Testing

### Test 13: Large Document
```
Upload ~10MB PDF and verify:
Expected:
  ✓ Verification completes within reasonable time (<5 seconds)
  ✓ No timeout errors
  ✓ Hash computed correctly
  ✓ Signature verified correctly
```

### Test 14: Multiple Simultaneous Verifications
```
Open multiple documents, start verification on multiple:
Expected:
  ✓ No modal/state conflicts
  ✓ Each verifies independently
  ✓ Results don't cross-contaminate
```

## Database & Logging

### Test 15: Verify Database Updates
```
After successful approval:
db.documents.findOne({_id: "<doc_id>"})

Expected fields:
{
  status: "Verified",
  verifiedBy: ObjectId("<faculty_id>"),
  verifiedAt: ISODate("2024-02-01T..."),
  remarks: "Optional remarks text",
  ...
}
```

### Test 16: Verify Activity Logs
```
Check activity logs:
db.activitylogs.findOne({action: "DOCUMENT_VERIFICATION"})

Expected:
{
  action: "DOCUMENT_VERIFICATION",
  userId: ObjectId("<faculty_id>"),
  resourceId: ObjectId("<doc_id>"),
  details: {
    action: "approve",
    remarks: "...",
    status: "Verified"
  },
  timestamp: ...
}
```

## Browser Console Verification

### Test 17: Console Output - Success
```
Expected in console when verification succeeds:
✓ Detected plain hex format AES key
  OR
✓ Detected RSA-encrypted base64 format AES key
✓ Successfully decrypted RSA-encrypted AES key
✓ AES key successfully parsed. Final length: 32 bytes
🔍 DOCUMENT VERIFICATION PROCESS INITIATED 🔍
✓ Integrity Check: VALID
✓ Signature Check: VALID
FINAL VERDICT: DOCUMENT IS SAFE & AUTHENTIC
```

### Test 18: Console Output - RSA Decrypt Failure
```
Expected in console when RSA decryption fails:
✓ Detected RSA-encrypted base64 format AES key
✓ Faculty private key found. Length: 1704
RSA decryption error details: {
  message: "...",
  code: "...",
  privateKeyPreview: "-----BEGIN PRIVATE KEY-----..."
}
Failed to decrypt RSA-encrypted AES key: ...
```

## Security Testing

### Test 19: Cannot Verify Twice
```
1. Approve a document
2. Try to approve again (if UI allows)
Expected:
  ✓ Button is disabled for non-pending documents
  ✓ Backend returns error if attempted
```

### Test 20: Authorization Check
```
1. Student tries to access verify endpoint directly
Expected:
  ✓ 403 Forbidden error
  ✓ Cannot verify as non-faculty
```

### Test 21: Document Ownership
```
1. Faculty verifies document for Student A
2. Student B tries to download that document
Expected:
  ✓ Student B gets 403 Unauthorized
  ✓ Cannot access another student's documents
```

## Final Checklist

- [ ] All 21 tests passed
- [ ] No console errors (except warnings)
- [ ] All error messages are user-friendly
- [ ] Database records are correct
- [ ] Modals display and dismiss properly
- [ ] Success message shows on approval
- [ ] Document list refreshes after action
- [ ] Can reject with remarks
- [ ] RSA-encrypted keys decrypt correctly
- [ ] Hash verification works
- [ ] Signature verification works
- [ ] Frontend hex keys work
- [ ] Backend RSA keys work
- [ ] Error handling is robust
- [ ] No SQL injection vulnerabilities
- [ ] No unauthorized access
- [ ] Performance is acceptable
- [ ] Code is properly documented
- [ ] No breaking changes to existing features

## Known Limitations & Notes

1. **Key Format Detection**: Based on length and character patterns
   - May have false positives if unusual formats are introduced
   - Test with custom key formats if applicable

2. **RSA Decryption**: Uses PKCS1_OAEP padding
   - Must match the padding used during encryption
   - If backend changes padding, decryption will fail

3. **Error Messages**: Generic messages to prevent key leakage
   - Actual error details in server console only
   - User sees helpful but non-technical messages

4. **Performance**: Hash verification is CPU-bound
   - Large files may take time
   - Consider async processing for 100MB+ files

## Rollback Procedure (If Needed)

If issues arise:
1. Revert `/app/api/faculty/verify-document/route.ts` to previous version
2. Revert `/app/faculty/dashboard/page.tsx` to previous version
3. Restart Next.js development server
4. Test with previously working documents

Note: Documents uploaded after changes may not be verifiable with old code.

