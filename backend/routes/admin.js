const express = require('express');
const User = require('../models/User');
const Document = require('../models/Document');
const ActivityLog = require('../models/ActivityLog');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/all-users', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password -privateKeySimulated');

    const userStats = {
      totalUsers: users.length,
      students: users.filter((u) => u.role === 'Student').length,
      faculty: users.filter((u) => u.role === 'Faculty').length,
      admins: users.filter((u) => u.role === 'Admin').length,
    };

    console.log(`[ADMIN] Retrieved ${users.length} users`);

    res.json({
      stats: userStats,
      users: users.map((u) => ({
        id: u._id,
        fullName: u.fullName,
        username: u.username,
        email: u.email,
        role: u.role,
        isActive: u.isActive,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error.message);
    res.status(500).json({ message: 'Error retrieving users', error: error.message });
  }
});

router.get('/activity-logs', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(1000);

    console.log(`[ADMIN] Retrieved ${logs.length} activity logs`);

    res.json({
      logs: logs.map((log) => ({
        id: log._id,
        username: log.username,
        role: log.role,
        action: log.action,
        details: log.details,
        timestamp: log.timestamp,
      })),
    });
  } catch (error) {
    console.error('[ADMIN ERROR]', error.message);
    res.status(500).json({ message: 'Error retrieving logs', error: error.message });
  }
});

router.get('/document-stats', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const documents = await Document.find();

    const stats = {
      totalDocuments: documents.length,
      pending: documents.filter((d) => d.status === 'Pending').length,
      verified: documents.filter((d) => d.status === 'Verified').length,
      rejected: documents.filter((d) => d.status === 'Rejected').length,
    };

    console.log(`[ADMIN] Document stats: ${JSON.stringify(stats)}`);

    res.json(stats);
  } catch (error) {
    console.error('[ADMIN ERROR]', error.message);
    res.status(500).json({ message: 'Error retrieving stats', error: error.message });
  }
});

router.post('/disable-user', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    const user = await User.findByIdAndUpdate(userId, { isActive: false }, { new: true });

    console.log(`[ADMIN] User disabled: ${user.username}`);

    res.json({ message: 'User disabled', user: { id: user._id, username: user.username } });
  } catch (error) {
    console.error('[ADMIN ERROR]', error.message);
    res.status(500).json({ message: 'Error disabling user', error: error.message });
  }
});

router.post('/remove-user', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    const user = await User.findByIdAndDelete(userId);

    console.log(`[ADMIN] User removed: ${user.username}`);

    res.json({ message: 'User removed', user: { id: user._id, username: user.username } });
  } catch (error) {
    console.error('[ADMIN ERROR]', error.message);
    res.status(500).json({ message: 'Error removing user', error: error.message });
  }
});

module.exports = router;
