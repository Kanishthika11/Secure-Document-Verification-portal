# System Architecture Overview

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │         React Application (Port 3000)                   │   │
│  │  ┌────────────┐  ┌─────────────┐  ┌──────────────┐     │   │
│  │  │ LoginPage  │  │   OTPPage   │  │ RegisterPage │     │   │
│  │  └────────────┘  └─────────────┘  └──────────────┘     │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │          Authenticated Routes                    │   │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌─────────────┐      │   │   │
│  │  │  │ Student  │ │ Faculty  │ │ Admin       │      │   │   │
│  │  │  │ Dashboard│ │Dashboard │ │ Dashboard   │      │   │   │
│  │  │  └──────────┘ └──────────┘ └─────────────┘      │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────┐    │   │
│  │  │     AuthContext (State Management)             │    │   │
│  │  │  - token (JWT)                                 │    │   │
│  │  │  - user data                                   │    │   │
│  │  │  - login/logout functions                      │    │   │
│  │  └────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  │  ┌────────────────────────────────────────────────┐    │   │
│  │  │     API Client (Axios)                         │    │   │
│  │  │  - Base URL: http://localhost:5000/api        │    │   │
│  │  │  - JWT interceptor                             │    │   │
│  │  │  - Error handling                              │    │   │
│  │  └────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│                    HTTPS Requests/Responses                      │
│                         (API Calls)                              │
│                                                                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       │ http://localhost:5000/api
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND SERVER (Node.js)                      │
│                    Express Application                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Routes Layer (Port 5000)                         │  │
│  │  ┌─────────────┐  ┌──────────┐  ┌──────────┐            │  │
│  │  │ auth.js     │  │student.js│  │faculty.js│ admin.js   │  │
│  │  │ - register  │  │- profile │  │- verify  │ - users    │  │
│  │  │ - login     │  │- upload  │  │- approve │ - logs     │  │
│  │  │ - verify-otp│  │-documents│  │- reject  │ - stats    │  │
│  │  └─────────────┘  └──────────┘  └──────────┘            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ▲                                     │
│                           │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Middleware Layer                                 │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ authMiddleware.js                                │   │  │
│  │  │ - authenticateToken() - validates JWT           │   │  │
│  │  │ - authorizeRole() - checks user role            │   │  │
│  │  │ - Returns 401/403 for unauthorized              │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ▲                                     │
│                           │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Utilities & Business Logic                       │  │
│  │  ┌──────────────────────────────────────────────────┐   │  │
│  │  │ cryptoUtils.js                                   │   │  │
│  │  │ RSA Operations:                                  │   │  │
│  │  │ - generateKeyPair()       (RSA 2048-bit)        │   │  │
│  │  │ - signDocument()          (SHA-256 + RSA)       │   │  │
│  │  │ - verifySignature()       (RSA validation)      │   │  │
│  │  │                                                  │   │  │
│  │  │ AES Operations:                                  │   │  │
│  │  │ - encryptDocument()       (AES-256-CBC)         │   │  │
│  │  │ - decryptDocument()       (AES-256-CBC)         │   │  │
│  │  │                                                  │   │  │
│  │  │ Hashing:                                         │   │  │
│  │  │ - generateHash()          (SHA-256)             │   │  │
│  │  │                                                  │   │  │
│  │  │ Password:                                        │   │  │
│  │  │ - hashPassword()          (bcryptjs)            │   │  │
│  │  │ - comparePassword()       (bcryptjs)            │   │  │
│  │  └──────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ▲                                     │
│                           │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Database Models Layer (Mongoose)                 │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │ User.js      │  │ Document.js  │  │ ActivityLog  │  │  │
│  │  │ Schema:      │  │ Schema:      │  │ Schema:      │  │  │
│  │  │ - fullName   │  │ - studentId  │  │ - userId     │  │  │
│  │  │ - email      │  │ - docType    │  │ - action     │  │  │
│  │  │ - username   │  │ - encrypted  │  │ - details    │  │  │
│  │  │ - password   │  │ - signature  │  │ - timestamp  │  │  │
│  │  │ - role       │  │ - hash       │  │              │  │  │
│  │  │ - publicKey  │  │ - status     │  │ Pre-hooks:   │  │  │
│  │  │ - privateKey │  │ - remarks    │  │ - Auto-log   │  │  │
│  │  │              │  │              │  │              │  │  │
│  │  │ Pre-save:    │  │ Methods:     │  └──────────────┘  │  │
│  │  │ - Hash pass  │  │ - Decrypt()  │                     │  │
│  │  │ - Gen RSA    │  │ - Verify()   │                     │  │
│  │  └──────────────┘  └──────────────┘                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ▲                                     │
│                           │ (Mongoose Queries)                  │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Database Layer                                   │  │
│  │  - Connection: mongodb://localhost:27017                │  │
│  │  - Database: secure-document-portal                     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                       │
                       │ (MongoDB Queries/Responses)
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER (MongoDB)                      │
│  Port: 27017                                                     │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Database: secure-document-portal                         │  │
│  │                                                           │  │
│  │ Collections:                                             │  │
│  │                                                           │  │
│  │ 1. users                                                 │  │
│  │    Documents:                                            │  │
│  │    - _id: ObjectId                                       │  │
│  │    - fullName, email, username, role                    │  │
│  │    - password (bcrypt hashed)                            │  │
│  │    - publicKey (RSA PEM format)                         │  │
│  │    - privateKeySimulated (RSA PEM format)               │  │
│  │    - profile fields (dept, reg no, etc)                 │  │
│  │    - isActive, timestamps                                │  │
│  │                                                           │  │
│  │ 2. documents                                             │  │
│  │    Documents:                                            │  │
│  │    - _id: ObjectId                                       │  │
│  │    - studentId (ref: users)                             │  │
│  │    - documentType (Mark Sheets, Certificates, etc)      │  │
│  │    - encryptedFile (Base64 AES-256 encrypted)          │  │
│  │    - encryptedAESKey (Base64 RSA encrypted)            │  │
│  │    - hash (SHA-256 hex string)                          │  │
│  │    - digitalSignature (Base64 RSA signature)           │  │
│  │    - status (Pending/Verified/Rejected)                │  │
│  │    - remarks, timestamps                                │  │
│  │                                                           │  │
│  │ 3. activitylogs                                          │  │
│  │    Documents:                                            │  │
│  │    - _id: ObjectId                                       │  │
│  │    - userId (ref: users)                               │  │
│  │    - username, role, action                            │  │
│  │    - documentId (optional, ref: documents)             │  │
│  │    - details, timestamp                                │  │
│  │                                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER REGISTRATION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend (Register Form)                                        │
│  ├─ User inputs: name, email, username, password, role         │
│  └─ POST /api/auth/register {user data}                        │
│                    │                                             │
│                    ▼                                             │
│  Backend (auth.js - register route)                             │
│  ├─ Validate input data                                         │
│  ├─ Check username/email not exists                             │
│  ├─ Hash password with bcryptjs (10 rounds)                     │
│  ├─ Generate RSA 2048-bit key pair (node crypto)               │
│  │   - Public key: 64 lines of PEM text                        │
│  │   - Private key: 80 lines of PEM text                       │
│  ├─ Create user in DB with all fields                          │
│  └─ Return success with user ID                                │
│                    │                                             │
│                    ▼                                             │
│  MongoDB (users collection)                                     │
│  └─ Store: user doc with hashed password & RSA keys           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        USER LOGIN                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend (Login Form)                                           │
│  ├─ User inputs: username, password                            │
│  └─ POST /api/auth/login {username, password}                 │
│                    │                                             │
│                    ▼                                             │
│  Backend (auth.js - login route)                                │
│  ├─ Find user by username                                       │
│  ├─ Compare password with bcryptjs                             │
│  ├─ Generate 6-digit OTP (e.g., "382914")                     │
│  ├─ Set OTP expiry (2 minutes)                                 │
│  ├─ Store OTP in memory                                        │
│  ├─ Log OTP to console: "[AUTH] OTP generated: 382914"        │
│  └─ Return userId to frontend                                  │
│                    │                                             │
│                    ▼                                             │
│  Frontend (OTP Page)                                            │
│  ├─ Display 6 input fields                                      │
│  ├─ User reads OTP from backend terminal                       │
│  ├─ User enters OTP digits                                      │
│  └─ POST /api/auth/verify-otp {userId, otp}                   │
│                    │                                             │
│                    ▼                                             │
│  Backend (auth.js - verify-otp route)                          │
│  ├─ Find user by userId                                         │
│  ├─ Verify OTP matches (and not expired)                       │
│  ├─ Generate JWT token                                         │
│  │   - Header: {alg: "HS256", typ: "JWT"}                     │
│  │   - Payload: {userId, role, iat, exp}                     │
│  │   - Signature: HMAC-SHA256 with JWT_SECRET                │
│  │   - Expiry: 1 hour from now                                │
│  ├─ Clear OTP from memory                                      │
│  ├─ Log login action to ActivityLog                           │
│  └─ Return JWT token + user data                              │
│                    │                                             │
│                    ▼                                             │
│  Frontend (AuthContext)                                         │
│  ├─ Store JWT in localStorage                                  │
│  ├─ Store user data in state                                   │
│  ├─ Redirect to dashboard                                      │
│  └─ Include JWT in all future API requests                    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Document Encryption & Upload Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     STUDENT UPLOAD DOCUMENT                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend (Student Dashboard)                                   │
│  ├─ User clicks document type (e.g., "Mark Sheets")           │
│  ├─ Modal opens with file picker                              │
│  ├─ User selects PDF file from computer                       │
│  ├─ Frontend reads file as Base64 string                      │
│  └─ POST /api/student/upload-document                         │
│      {documentType, fileContent(Base64)}                       │
│                    │                                             │
│                    ▼                                             │
│  Backend (cryptoUtils.js + Document Model)                     │
│                                                                   │
│  Step 1: Parse Request                                          │
│  ├─ Extract documentType and Base64 content                   │
│  └─ Verify user authenticated (JWT valid)                     │
│                    │                                             │
│  Step 2: Generate Encryption Key                               │
│  ├─ Generate random 32-byte AES key                           │
│  ├─ Generate random 16-byte IV (initialization vector)        │
│  └─ Store IV with encrypted data                              │
│                    │                                             │
│  Step 3: Encrypt Document with AES-256-CBC                    │
│  ├─ Algorithm: AES-256 in CBC mode                            │
│  ├─ Input: Base64 file content                                │
│  ├─ Key: 32 random bytes                                       │
│  ├─ IV: 16 random bytes                                        │
│  ├─ Process: Encrypt using crypto.createCipheriv()            │
│  ├─ Output: Encrypted bytes → Base64 string                   │
│  └─ Example output length: Original × 1.3-1.4x                │
│                    │                                             │
│  Step 4: Encrypt AES Key with Faculty RSA                      │
│  ├─ Get faculty's RSA public key from DB                      │
│  ├─ Encrypt 32-byte AES key with RSA-2048                     │
│  ├─ Output: Encrypted key (256 bytes) → Base64               │
│  └─ Only faculty with private key can decrypt                │
│                    │                                             │
│  Step 5: Generate Integrity Hash                               │
│  ├─ Compute SHA-256 hash of original file                     │
│  ├─ Output: 64 hex characters (e.g., "a2b3c4...")           │
│  └─ Used to detect tampering                                  │
│                    │                                             │
│  Step 6: Generate Digital Signature                            │
│  ├─ Get student's RSA private key from DB                     │
│  ├─ Sign the hash with RSA private key                        │
│  ├─ Output: Signature (256 bytes) → Base64                   │
│  └─ Faculty verifies with student's public key               │
│                    │                                             │
│  Step 7: Store in Database                                     │
│  ├─ Create Document record with:                              │
│  │   - studentId: Current user ID                             │
│  │   - documentType: "Mark Sheets"                            │
│  │   - encryptedFile: Base64 encrypted content               │
│  │   - encryptedAESKey: Base64 encrypted AES key             │
│  │   - hash: SHA-256 hex string                              │
│  │   - digitalSignature: Base64 signature                     │
│  │   - status: "Pending"                                       │
│  │   - uploadedAt: Current timestamp                          │
│  └─ Save to MongoDB documents collection                      │
│                    │                                             │
│  Step 8: Log Activity                                           │
│  ├─ Create ActivityLog entry:                                  │
│  │   - action: "Upload"                                       │
│  │   - documentId: New document ID                            │
│  │   - details: "Uploaded Mark Sheets"                        │
│  │   - timestamp: Now                                          │
│  └─ Save to MongoDB activitylogs collection                   │
│                    │                                             │
│                    ▼                                             │
│  MongoDB (documents + activitylogs)                            │
│  ├─ Document stored with encryption                           │
│  ├─ Activity logged                                            │
│  └─ Status: Pending Faculty Review                            │
│                    │                                             │
│                    ▼                                             │
│  Frontend (Student Dashboard)                                   │
│  ├─ Modal closes                                               │
│  ├─ Success message shown                                      │
│  ├─ New document appears in table                             │
│  └─ Status: Pending                                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 3. Document Verification & Tamper Detection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     FACULTY VERIFY DOCUMENT                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Frontend (Faculty Dashboard)                                   │
│  ├─ Faculty sees pending documents in table                    │
│  ├─ Clicks "Verify" button on a document                      │
│  ├─ Verification modal opens                                   │
│  └─ POST /api/faculty/verify-document {documentId}            │
│                    │                                             │
│                    ▼                                             │
│  Backend (cryptoUtils.js + Document Model)                     │
│                                                                   │
│  Step 1: Retrieve Document from Database                       │
│  ├─ Find document by ID                                        │
│  ├─ Verify requestor is faculty (middleware)                  │
│  ├─ Get:                                                        │
│  │   - encryptedFile (Base64)                                 │
│  │   - encryptedAESKey (Base64)                               │
│  │   - hash (SHA-256 hex)                                     │
│  │   - digitalSignature (Base64)                              │
│  │   - studentId (who uploaded)                               │
│  └─ Status should be "Pending"                                │
│                    │                                             │
│  Step 2: Decrypt AES Key                                       │
│  ├─ Get faculty's RSA private key from DB                     │
│  ├─ Convert encryptedAESKey from Base64 to bytes             │
│  ├─ Decrypt using RSA private key                             │
│  │   (crypto.privateDecrypt() with padding)                   │
│  ├─ Extract: 32-byte AES key + 16-byte IV                    │
│  └─ Output: Original AES-256 key                              │
│                    │                                             │
│  Step 3: Decrypt Document                                      │
│  ├─ Convert encryptedFile from Base64 to bytes               │
│  ├─ Decrypt using AES-256-CBC with recovered key            │
│  ├─ Use IV that was stored with encrypted data               │
│  ├─ Process: crypto.createDecipheriv()                        │
│  └─ Output: Original file content (Base64)                    │
│                    │                                             │
│  Step 4: Verify Integrity (Hash Check)                        │
│  ├─ Compute SHA-256 hash of decrypted file                   │
│  ├─ Compare with stored hash value                            │
│  │                                                              │
│  │   IF hashes match:                                          │
│  │   ├─ Document integrity verified ✓                         │
│  │   ├─ No tampering detected                                 │
│  │   └─ Set integrityCheck = true                            │
│  │                                                              │
│  │   IF hashes DO NOT match:                                  │
│  │   ├─ TAMPERING DETECTED! ⚠️                               │
│  │   ├─ Document modified after upload                        │
│  │   ├─ Set integrityCheck = false                           │
│  │   └─ Disable approval (prevent approval)                   │
│  └─ Log this check attempt                                    │
│                    │                                             │
│  Step 5: Verify Authenticity (Signature Check)                │
│  ├─ Get student's RSA public key from DB                      │
│  ├─ Get stored digitalSignature (Base64)                      │
│  ├─ Convert signature from Base64 to bytes                    │
│  ├─ Verify signature with student's public key              │
│  │   (crypto.createVerify())                                  │
│  ├─                                                             │
│  │   IF signature valid:                                       │
│  │   ├─ Document authenticity verified ✓                      │
│  │   ├─ Proves student created it                             │
│  │   ├─ Set signatureValid = true                            │
│  │   └─ Non-repudiation established                           │
│  │                                                              │
│  │   IF signature INVALID:                                    │
│  │   ├─ SIGNATURE FAILED! ⚠️                                 │
│  │   ├─ Document not signed by original student               │
│  │   ├─ Set signatureValid = false                           │
│  │   └─ Disable approval (prevent approval)                   │
│  └─ Log this check attempt                                    │
│                    │                                             │
│  Step 6: Generate Verification Result                         │
│  └─ Return to frontend:                                        │
│     ├─ integrityCheck: true/false                            │
│     ├─ signatureValid: true/false                             │
│     ├─ message:                                                │
│     │   ├─ If both valid: "Document verified"               │
│     │   ├─ If integrity failed: "Tampering detected!"        │
│     │   ├─ If signature failed: "Signature invalid!"         │
│     │   └─ If both failed: "Multiple verification errors!"   │
│     ├─ decryptedFile: Base64 (for viewing/download)          │
│     └─ tamperingDetected: boolean                            │
│                    │                                             │
│                    ▼                                             │
│  Frontend (Verification Modal)                                 │
│  ├─ Display verification results:                             │
│  │   ├─ ✓ Hash verification: PASSED/FAILED                  │
│  │   ├─ ✓ Signature verification: PASSED/FAILED             │
│  │   └─ ⚠️ Document Status: Tampered/Valid/etc               │
│  │                                                              │
│  ├─ IF both checks PASSED:                                    │
│  │   ├─ Enable "Approve" button (green)                       │
│  │   ├─ Enable "Reject" button (red)                          │
│  │   ├─ Enable remarks input                                  │
│  │   └─ Faculty chooses action                               │
│  │                                                              │
│  ├─ IF any check FAILED:                                      │
│  │   ├─ Disable "Approve" button                              │
│  │   ├─ Show warning: "Cannot approve tampered document"     │
│  │   ├─ Faculty cannot approve                                │
│  │   └─ Only "Reject" available                              │
│  │                                                              │
│  └─ Faculty clicks "Approve" or "Reject"                     │
│                    │                                             │
│                    ▼                                             │
│  POST /api/faculty/verify-document                            │
│  {documentId, action: "approve"|"reject", remarks: "..."}    │
│                    │                                             │
│                    ▼                                             │
│  Backend (faculty.js - verify route)                          │
│  ├─ Update document record:                                   │
│  │   ├─ status: "Verified" or "Rejected"                    │
│  │   ├─ remarks: Faculty's comment                            │
│  │   ├─ verifiedBy: Faculty user ID                          │
│  │   └─ verifiedAt: Current timestamp                        │
│  ├─ Save to MongoDB documents collection                      │
│  ├─ Create ActivityLog:                                       │
│  │   ├─ action: "Approve" or "Reject"                        │
│  │   ├─ details: "Verified Mark Sheets - All checks passed" │
│  │   └─ timestamp: Now                                        │
│  └─ Return success response                                   │
│                    │                                             │
│                    ▼                                             │
│  MongoDB (documents + activitylogs)                           │
│  ├─ Document status updated                                   │
│  ├─ Activity logged                                            │
│  └─ Process complete                                           │
│                    │                                             │
│                    ▼                                             │
│  Frontend (Faculty Dashboard)                                  │
│  ├─ Modal closes                                               │
│  ├─ Success message shown                                      │
│  ├─ Document status updated in table                         │
│  │   ├─ From "Pending" to "Verified" or "Rejected"          │
│  │   ├─ Remarks displayed                                     │
│  │   └─ Verified by faculty name                              │
│  └─ Student can see updated status                            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Interaction Flow

### Frontend Component Hierarchy

```
App.jsx (Main)
├─ AuthContext Provider
│  └─ Provides: {token, user, login, logout, otp}
│
├─ Route: /
│  └─ LoginPage
│     └─ Calls: auth/login → Redirects to OTPPage
│
├─ Route: /register
│  └─ RegisterPage
│     └─ Calls: auth/register → Redirects to LoginPage
│
├─ Route: /otp
│  └─ OTPPage
│     ├─ Uses: AuthContext
│     └─ Calls: auth/verify-otp → Redirects to /student|/faculty|/admin
│
├─ ProtectedRoute /student
│  └─ StudentDashboard
│     ├─ Uses: AuthContext
│     ├─ Components:
│     │  ├─ ProfileModal (click avatar)
│     │  ├─ DocumentCard (6 cards for doc types)
│     │  ├─ UploadModal (file picker)
│     │  └─ DocumentsTable
│     └─ Calls: student/profile, student/upload, student/my-documents
│
├─ ProtectedRoute /faculty
│  └─ FacultyDashboard
│     ├─ Uses: AuthContext
│     ├─ Components:
│     │  ├─ FilterButtons (document types)
│     │  ├─ DocumentsTable
│     │  └─ VerificationModal
│     └─ Calls: faculty/assigned-documents, faculty/verify-document
│
└─ ProtectedRoute /admin
   └─ AdminDashboard
      ├─ Uses: AuthContext
      ├─ Tabs:
      │  ├─ Overview (stats cards)
      │  ├─ Users (users table)
      │  └─ Activity Logs (logs timeline)
      └─ Calls: admin/all-users, admin/activity-logs, admin/document-stats
```

### Backend Route Handler Flow

```
Request comes in
│
▼
Express middleware stack
├─ cors()
├─ bodyParser.json()
├─ logging middleware
└─ route matching
│
▼
Route handler (e.g., POST /api/auth/login)
│
├─ Validate input data
│
├─ Authenticate (if protected route)
│  ├─ Extract JWT from Authorization header
│  ├─ Verify JWT signature with JWT_SECRET
│  ├─ Extract userId and role from payload
│  ├─ Check token expiry
│  └─ Return 401 if invalid/expired
│
├─ Authorize (if role-based route)
│  ├─ Check user.role matches required role
│  └─ Return 403 if unauthorized
│
├─ Execute business logic
│  ├─ Query MongoDB (Mongoose models)
│  ├─ Apply transformations/validations
│  ├─ Call crypto utilities if needed
│  ├─ Store activity logs
│  └─ Generate response data
│
└─ Send response
   ├─ 200 + data (success)
   ├─ 201 + data (created)
   ├─ 400 + error (bad request)
   ├─ 401 + error (unauthorized)
   ├─ 403 + error (forbidden)
   └─ 500 + error (server error)
```

---

## Security Layers

### Layer 1: Frontend Security
```
Local Storage (JWT Token)
    ↓
AuthContext (State Management)
    ↓
ProtectedRoute Component (Route Guards)
    ↓
Axios Interceptor (JWT Injection)
    ↓
User Can Access Protected Pages
```

### Layer 2: API Security
```
Request comes in
    ↓
CORS Check (localhost:3000)
    ↓
JWT Validation Middleware (authenticateToken)
    ↓
Role Check Middleware (authorizeRole)
    ↓
Business Logic Execution
    ↓
Database Operation
```

### Layer 3: Data Security
```
Encryption:
  Password → bcryptjs hashing (10 rounds)
  Document → AES-256-CBC encryption
  AES Key → RSA 2048 encryption
  Hash → SHA-256 hashing
  
Integrity:
  Digital Signature → RSA signing
  Hash Verification → Compare SHA-256
  Signature Verification → RSA verification

Authentication:
  Multi-factor: Password + OTP
  JWT: Stateless token-based
  Session: Token persistence
```

---

## Deployment Architecture

### Development Environment
```
Laptop/Desktop
├─ Node.js (v16+)
├─ npm/yarn
├─ VS Code
├─ Frontend: http://localhost:3000
├─ Backend: http://localhost:5000
└─ MongoDB: localhost:27017
```

### Production Environment
```
Web Servers
├─ Backend Server (Node.js + Express)
│  ├─ Hosted on: Heroku, AWS, DigitalOcean, etc.
│  ├─ Port: 80 (HTTP) or 443 (HTTPS)
│  └─ Database: MongoDB Atlas (cloud)
│
├─ Frontend Server (React SPA)
│  ├─ Hosted on: Vercel, Netlify, AWS S3, etc.
│  ├─ CDN: CloudFlare, AWS CloudFront, etc.
│  └─ HTTPS: Automatic
│
└─ Database (MongoDB)
   ├─ MongoDB Atlas (cloud)
   ├─ Replicated across multiple servers
   ├─ Automated backups
   └─ 99.99% uptime SLA
```

---

**This architecture ensures secure, scalable, and maintainable application structure.**
