const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const CryptoUtils = require('../utils/cryptoUtils');

const router = express.Router();

const otpStore = {};

router.post('/register', async (req, res) => {
  try {
    const { fullName, email, username, password, role, department, registrationNumber } = req.body;

    if (!fullName || !email || !username || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    const { publicKey, privateKey } = CryptoUtils.generateRSAKeyPair();

    const newUser = new User({
      fullName,
      email,
      username,
      password,
      role,
      department: role === 'Student' ? department : undefined,
      registrationNumber: role === 'Student' ? registrationNumber : undefined,
      publicKey,
      privateKeySimulated: privateKey,
    });

    await newUser.save();

    console.log(`[AUTH] User registered: ${username} (Role: ${role})`);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('[AUTH ERROR]', error.message);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is disabled' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const userId = user._id.toString();
    
    otpStore[userId] = {
      otp,
      expiresAt: Date.now() + 2 * 60 * 1000,
    };

    // Console logging for OTP - IMPORTANT FOR TESTING
    console.log('\n');
    console.log('═══════════════════════════════════════════════');
    console.log('🔐 OTP GENERATED FOR LOGIN');
    console.log('═══════════════════════════════════════════════');
    console.log(`Username: ${username}`);
    console.log(`User ID: ${userId}`);
    console.log(`OTP CODE: ${otp}`);
    console.log(`Expires in: 2 minutes`);
    console.log('═══════════════════════════════════════════════\n');

    await ActivityLog.create({
      userId: user._id,
      username: user.username,
      role: user.role,
      action: 'Login',
      details: 'Login attempt, OTP generated',
    });

    await ActivityLog.create({
      userId: user._id,
      username: user.username,
      role: user.role,
      action: 'OTP Generated',
      details: `OTP: ${otp}`,
    });

    res.json({
      message: 'OTP sent to console',
      userId: userId,
      otp,
    });
  } catch (error) {
    console.error('[AUTH ERROR]', error.message);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    console.log('\n[OTP VERIFICATION] Attempting verification...');
    console.log(`Received userId: ${userId}`);
    console.log(`Received OTP: ${otp}`);
    console.log(`Stored OTPs: ${JSON.stringify(Object.keys(otpStore))}`);

    if (!userId || !otp) {
      console.log('[OTP ERROR] Missing userId or OTP');
      return res.status(400).json({ message: 'userId and OTP required' });
    }

    const storedOTP = otpStore[userId];

    if (!storedOTP) {
      console.log(`[OTP ERROR] No OTP stored for userId: ${userId}`);
      return res.status(400).json({ message: 'OTP not generated or expired' });
    }

    if (Date.now() > storedOTP.expiresAt) {
      delete otpStore[userId];
      console.log(`[OTP ERROR] OTP expired for userId: ${userId}`);
      return res.status(400).json({ message: 'OTP expired' });
    }

    console.log(`Comparing OTP - Stored: ${storedOTP.otp}, Received: ${otp}`);

    if (storedOTP.otp !== otp) {
      console.log(`[OTP ERROR] Invalid OTP for userId: ${userId}`);
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    delete otpStore[userId];

    const user = await User.findById(userId);
    if (!user) {
      console.log(`[OTP ERROR] User not found for userId: ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    console.log('\n');
    console.log('═══════════════════════════════════════════════');
    console.log('✅ OTP VERIFICATION SUCCESSFUL');
    console.log('═══════════════════════════════════════════════');
    console.log(`Username: ${user.username}`);
    console.log(`Role: ${user.role}`);
    console.log(`JWT Token Generated: ${token.substring(0, 20)}...`);
    console.log('═══════════════════════════════════════════════\n');

    await ActivityLog.create({
      userId: user._id,
      username: user.username,
      role: user.role,
      action: 'OTP Verified',
      details: 'Multi-factor authentication successful',
    });

    res.json({
      message: 'Authentication successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('[AUTH ERROR]', error.message);
    res.status(500).json({ message: 'OTP verification failed', error: error.message });
  }
});

module.exports = router;
