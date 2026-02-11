require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/database');

const authRoutes = require('./routes/auth');
const studentRoutes = require('./routes/student');
const facultyRoutes = require('./routes/faculty');
const adminRoutes = require('./routes/admin');

const app = express();

connectDB();

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'Backend server is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  Secure Student Document Verification Portal - Backend         ║
║  Server running on http://localhost:${PORT}                       ║
║  Environment: ${process.env.NODE_ENV || 'development'}                    ║
╚════════════════════════════════════════════════════════════════╝
  `);
});
