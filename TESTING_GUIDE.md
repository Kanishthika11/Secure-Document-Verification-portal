# Complete Testing Guide - OTP & Full Workflow

## ⚡ Quick Start

```bash
# Terminal 1 - Backend
cd backend && npm install && npm run dev

# Terminal 2 - Frontend
cd frontend && npm install && npm run dev

# Open http://localhost:3000
```

## 🔐 OTP Testing - Step by Step

### Step 1: Register a Test User
1. Click "Register" on homepage
2. Fill in the form:
   - Full Name: `Test Student`
   - Email: `student@test.com`
   - Username: `teststudent`
   - Password: `Test@123`
   - Role: `Student`
   - Department: `Computer Science`
   - Registration Number: `CS2024001`
3. Click "Create Account"
4. You'll be redirected to login

### Step 2: Login & Generate OTP

1. Go to Login page
2. Enter:
   - Username: `teststudent`
   - Password: `Test@123`
3. Click "Sign In"

**⚠️ IMPORTANT: Check the Node.js Backend Console Now**

You will see output like:
```
═══════════════════════════════════════════════
🔐 OTP GENERATED FOR LOGIN
═══════════════════════════════════════════════
Username: teststudent
User ID: [some-mongodb-id]
OTP CODE: 123456
Expires in: 2 minutes
═══════════════════════════════════════════════
```

**Copy the OTP CODE (e.g., 123456)**

### Step 3: Verify OTP

1. You're now on the OTP verification page
2. Paste the OTP code from backend console into the input field
3. Click "Verify & Sign In"
4. Check backend console for verification confirmation:
```
═══════════════════════════════════════════════
✅ OTP VERIFICATION SUCCESSFUL
═══════════════════════════════════════════════
Username: teststudent
Role: Student
JWT Token Generated: eyJhbGciOiJIUzI1NiIs...
═══════════════════════════════════════════════
```

5. You should now be redirected to the Student Dashboard

## 📋 Complete User Flow

### Student Flow
```
Register → Login → OTP Verification → Student Dashboard
                                    ├─ View Profile
                                    ├─ Upload Documents (6 types)
                                    ├─ View Document Status
                                    └─ View Encryption Details
```

### Faculty Flow
```
Login → OTP Verification → Faculty Dashboard
                        ├─ View Pending Documents
                        ├─ Filter by Document Type
                        ├─ Verify with Tamper Detection
                        ├─ Approve/Reject
                        └─ View Statistics
```

### Admin Flow
```
Login → OTP Verification → Admin Dashboard
                        ├─ User Management
                        ├─ Activity Logs
                        ├─ System Statistics
                        └─ Security Policies
```

## 🧪 Test Credentials

### Pre-created Users (if using seed data):

**Student:**
- Username: `student1`
- Password: `Password@123`

**Faculty:**
- Username: `faculty1`
- Password: `Password@123`

**Admin:**
- Username: `admin1`
- Password: `Password@123`

## 🐛 Troubleshooting

### Issue: OTP Not Showing in Console
**Solution:**
1. Make sure backend is running: `npm run dev` in `/backend` folder
2. Check that Node.js server started without errors
3. Look for the box with `🔐 OTP GENERATED FOR LOGIN`

### Issue: OTP Verification Fails
**Error Message: "Invalid OTP"**
- Check you copied the OTP correctly (6 digits)
- Make sure OTP hasn't expired (2 minute window)
- Try logging in again to generate a new OTP

**Error Message: "OTP not generated or expired"**
- The OTP timeout has passed
- Click "Request New OTP" or go back to login

### Issue: Session Expired
**Error: "Session expired. Please login again."**
- Your session was lost (page refresh or too long)
- Simply go back to login page and start again

### Issue: Blank MongoDB Errors
**Solution:**
1. Check MongoDB is running: `mongod` command
2. Verify `.env` file has correct MongoDB URI
3. Check backend console for connection errors

## 📊 Console Logging

### Backend Console Shows:
- Registration: `[AUTH] User registered: [username] (Role: [role])`
- Login OTP: `🔐 OTP GENERATED FOR LOGIN` box
- OTP Verification: `✅ OTP VERIFICATION SUCCESSFUL` box
- All activity logs with timestamps

### Frontend Console Shows:
- API calls: `[FRONTEND] Verifying OTP with userId: ... OTP: ...`
- Successful verification: `[FRONTEND] OTP verification successful: ...`
- Errors: `[FRONTEND] OTP verification error: ...`

## ✅ Verification Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] MongoDB connection working
- [ ] Register new user successfully
- [ ] OTP displays in backend console
- [ ] OTP verification works
- [ ] Correct dashboard loads after OTP verification
- [ ] Profile displays user information
- [ ] Student can upload documents
- [ ] Faculty can verify documents
- [ ] Admin can see activity logs

## 🔒 Security Features Demonstrated

### Authentication
- ✅ Bcrypt password hashing (10 salt rounds)
- ✅ OTP-based multi-factor authentication
- ✅ JWT token generation (1 hour expiry)
- ✅ Session management

### Encryption
- ✅ RSA 2048-bit key generation at registration
- ✅ AES-256-CBC document encryption
- ✅ SHA-256 hashing for integrity

### Authorization
- ✅ Role-based access control
- ✅ Protected routes by role
- ✅ Backend authorization checks

### Audit Trail
- ✅ Activity logging for all actions
- ✅ User tracking
- ✅ Timestamps on all logs

## 📝 Notes

- All OTP codes are valid for exactly 2 minutes
- Passwords must have: uppercase, lowercase, number, special character
- Documents are encrypted before storage
- All API endpoints are protected by JWT tokens
- Role-based routing automatically handles redirects
