const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    documentType: {
      type: String,
      enum: [
        'Mark Sheets',
        'Degree Certificate',
        'Bonafide Certificate',
        'Internship Certificate',
        'ID Proof',
        'Other University Documents',
      ],
      required: true,
    },
    encryptedFile: {
      type: String,
      required: true,
    },
    encryptedAESKey: {
      type: String,
      required: true,
    },
    hash: {
      type: String,
      required: true,
    },
    digitalSignature: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending',
    },
    remarks: {
      type: String,
      default: '',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
    },
    verifiedAt: {
      type: Date,
      sparse: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    originalFileName: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Document', documentSchema);
