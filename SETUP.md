# Complete Setup Guide - Secure Document Verification Portal

## System Requirements

- **Node.js**: v16.0.0 or higher
- **MongoDB**: Local installation or MongoDB Atlas (cloud)
- **npm**: v8.0.0 or higher
- **RAM**: 2GB minimum
- **Storage**: 500MB available

---

## Pre-Installation Checklist

- [ ] Node.js installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] MongoDB running or connection string ready
- [ ] VS Code or preferred editor
- [ ] Terminal/Command prompt access

---

## Installation Steps

### Step 1: MongoDB Setup (Choose One)

#### Option A: Local MongoDB
```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Windows
# Download from https://www.mongodb.com/try/download/community
# Run installer and follow setup wizard

# Linux
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Verify MongoDB is running:**
```bash
mongosh
# Should connect to MongoDB shell
```

#### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Copy connection string (URI)
5. Use in backend `.env` file

---

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Edit .env with your configuration
# For local MongoDB: mongodb://localhost:27017/secure-document-portal
# For Atlas: mongodb+srv://username:password@cluster.mongodb.net/secure-document-portal
```

**Check .env file contains:**
```
MONGODB_URI=mongodb://localhost:27017/secure-document-portal
JWT_SECRET=your_super_secret_jwt_key_change_this
PORT=5000
NODE_ENV=development
```

**Start Backend Server:**
```bash
# From backend directory
npm run dev

# Or production mode
npm start
```

**Expected Output:**
```
╔════════════════════════════════════════════════════════════════╗
║  Secure Student Document Verification Portal - Backend         ║
║  Server running on http://localhost:5000                       ║
║  Environment: development                                      ║
╚════════════════════════════════════════════════════════════════╝
```

---

### Step 3: Frontend Setup

**Open NEW terminal window (keep backend running)**

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Verify .env.local exists
cat .env.local
# Should show: VITE_API_BASE_URL=http://localhost:5000/api

# Start development server
npm run dev
```

**Expected Output:**
```
  VITE v4.3.0  ready in 234 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

---

## Verification

### Check Both Servers Running

**Terminal 1 (Backend):**
```bash
cd backend && npm run dev
# Port 5000
```

**Terminal 2 (Frontend):**
```bash
cd frontend && npm run dev
# Port 3000
```

### Test Application

1. Open **http://localhost:3000** in browser
2. Should see login page with dark blue gradient background
3. Click "Register here" to create test account

---

## Creating Test Accounts

### Test User 1: Student

**Registration Page:**
- Full Name: `John Student`
- Email: `john@example.com`
- Username: `john_student`
- Password: `Test@123456`
- Role: `Student`
- Department: `Computer Science`
- Registration No: `CSE001`

**Then Login:**
- Username: `john_student`
- Password: `Test@123456`
- OTP: Check backend terminal console for 6-digit code
- Enter OTP to access dashboard

### Test User 2: Faculty

**Registration Page:**
- Full Name: `Dr. Smith`
- Email: `smith@example.com`
- Username: `smith_faculty`
- Password: `Test@123456`
- Role: `Faculty`

**Then Login:**
- Username: `smith_faculty`
- Password: `Test@123456`
- OTP: Check backend terminal console
- Enter OTP to access dashboard

### Test User 3: Admin

**Registration Page:**
- Full Name: `Admin User`
- Email: `admin@example.com`
- Username: `admin_user`
- Password: `Test@123456`
- Role: `Admin`

**Then Login:**
- Username: `admin_user`
- Password: `Test@123456`
- OTP: Check backend terminal console
- Enter OTP to access dashboard

---

## Testing Workflow

### 1. Student Upload Document
1. Login as Student
2. Click document type card (e.g., "Mark Sheets")
3. Click "Upload" button
4. Select PDF file from computer
5. Click "Upload" in modal
6. Document encrypted and stored
7. Status shows "Pending"

### 2. Faculty Verify Document
1. Login as Faculty
2. See uploaded document in table
3. Click "Verify" button
4. System checks:
   - Decrypts with faculty private key
   - Verifies SHA-256 hash (integrity)
   - Verifies RSA signature (authenticity)
5. If valid → Click "Approve" or "Reject"
6. Add remarks (optional)
7. Document status updated

### 3. Admin Monitor System
1. Login as Admin
2. Overview tab shows:
   - Total users breakdown
   - Document statistics
3. Users tab shows all registered users
4. Logs tab shows activity timeline

---

## Troubleshooting

### Issue: Backend won't start

**Error: `connect ECONNREFUSED`**
```bash
# MongoDB not running
# Solution: Start MongoDB
# macOS: brew services start mongodb-community
# Windows: Start MongoDB from Services
# Linux: sudo systemctl start mongodb
```

**Error: `Port 5000 already in use`**
```bash
# Change PORT in backend/.env
# Or kill process on port 5000
# macOS/Linux: lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
# Windows: netstat -ano | findstr :5000
```

### Issue: Frontend can't reach backend

**Check proxy in vite.config.js:**
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:5000',
    changeOrigin: true,
  },
}
```

**Verify backend running:**
```bash
curl http://localhost:5000/health
# Should return: {"status":"Backend server is running"}
```

### Issue: OTP not showing

**Check backend terminal logs:**
```
[AUTH] OTP generated for username: 123456
```

The 6-digit code is displayed in the backend terminal when you login.

### Issue: Document upload fails

**Check file size:**
- Maximum 50MB
- Supported format: PDF

**Check backend console for errors:**
```
[STUDENT ERROR] ...
```

---

## Database Configuration

### Using Local MongoDB

```bash
# .env file
MONGODB_URI=mongodb://localhost:27017/secure-document-portal
```

### Using MongoDB Atlas

```bash
# .env file
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
```

**Get connection string from Atlas:**
1. Click "Connect"
2. Choose "Connect your application"
3. Copy connection string
4. Replace username and password
5. Replace database name

---

## Development Mode

### Running Both Servers Together

**Option 1: Separate Terminals (Recommended)**
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

**Option 2: Use Concurrently (Root level)**
```bash
npm install -g concurrently

# From root directory
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

---

## Common Commands

### Backend
```bash
# Development
npm run dev

# Production
npm start

# Install dependencies
npm install

# Check syntax
npm run lint (if configured)
```

### Frontend
```bash
# Development
npm run dev

# Build for production
npm run build

# Preview build
npm run preview

# Install dependencies
npm install
```

---

## Environment Variables Reference

### Backend (.env)
| Variable | Default | Description |
|----------|---------|-------------|
| MONGODB_URI | mongodb://localhost:27017/secure-document-portal | Database connection |
| JWT_SECRET | (required) | JWT signing key |
| PORT | 5000 | Server port |
| NODE_ENV | development | Environment mode |

### Frontend (.env.local)
| Variable | Default | Description |
|----------|---------|-------------|
| VITE_API_BASE_URL | http://localhost:5000/api | Backend API base URL |

---

## Performance Tips

1. **Database Indexing**: MongoDB automatically indexes common fields
2. **Token Caching**: JWT stored in localStorage for faster auth
3. **Lazy Loading**: Document lists paginated
4. **Compression**: Gzip enabled on API responses

---

## Security Notes

1. **Change JWT_SECRET** before production
2. **Use HTTPS** in production (currently HTTP for development)
3. **Set CORS properly** for your domain
4. **Validate all inputs** (partially implemented, add more)
5. **Use environment variables** for all secrets
6. **Regular security updates**: `npm audit fix`

---

## Deployment Readiness

### Before Production Deployment

- [ ] Change JWT_SECRET to random 32+ character string
- [ ] Update MongoDB_URI to production database
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for your domain
- [ ] Enable HTTPS/SSL
- [ ] Add rate limiting
- [ ] Add input validation
- [ ] Remove console.logs
- [ ] Set up error logging service
- [ ] Configure backup strategy

### Quick Deployment Checklist

```bash
# Backend
npm run build (if configured)
npm start

# Frontend
npm run build
# Deploy build/ folder to static hosting
```

---

## Support & Debugging

### Enable Debug Logs
```bash
# Backend
DEBUG=* npm run dev

# Frontend - Check browser console
F12 → Console tab
```

### Check System Health
```bash
# Verify backend
curl http://localhost:5000/health

# Test database
mongosh --eval "db.version()"
```

### Monitor Logs
```bash
# Backend logs show:
# [AUTH] - Authentication events
# [DB] - Database events
# [ERROR] - Error messages
# [CRYPTO] - Encryption operations
```

---

## Next Steps After Setup

1. ✓ Backend running on port 5000
2. ✓ Frontend running on port 3000
3. ✓ Create test users (Student, Faculty, Admin)
4. ✓ Test document upload and verification
5. ✓ Check admin monitoring features
6. ✓ Review security policies page
7. → Prepare for viva/presentation
8. → Deploy to production when ready

---

## Viva Preparation Topics

- How does OTP-based MFA work?
- Explain AES-256 encryption process
- What is RSA digital signature?
- How is tampering detected?
- What is role-based access control?
- Explain the complete document verification flow
- What are the security policies implemented?

---

## Getting Help

If you encounter issues:

1. **Check backend terminal** for error logs
2. **Check browser console** (F12) for frontend errors
3. **Verify MongoDB connection**: `mongosh`
4. **Verify ports available**: `lsof -i :5000` and `lsof -i :3000`
5. **Reinstall dependencies**: `rm -rf node_modules package-lock.json && npm install`

---

**Application fully set up and ready to run!**

For detailed API documentation, see README.md
For security implementation details, see the code comments
