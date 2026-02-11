const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/secure-document-portal';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('[DB] MongoDB connected successfully');
  } catch (error) {
    console.error('[DB ERROR]', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
