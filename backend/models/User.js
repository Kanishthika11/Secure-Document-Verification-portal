const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['Student', 'Faculty', 'Admin'],
      required: true,
    },
    studentId: {
      type: String,
      sparse: true,
    },
    department: {
      type: String,
      sparse: true,
    },
    registrationNumber: {
      type: String,
      sparse: true,
    },
    publicKey: {
      type: String,
    },
    privateKeySimulated: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (passwordToCheck) {
  return await bcrypt.compare(passwordToCheck, this.password);
};

module.exports = mongoose.model('User', userSchema);
