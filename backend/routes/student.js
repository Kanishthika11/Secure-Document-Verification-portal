const express = require('express');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Document = require('../models/Document');
const ActivityLog = require('../models/ActivityLog');
const CryptoUtils = require('../utils/cryptoUtils');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

const DOCUMENT_TYPES = [
  'Mark Sheets',
  'Degree Certificate',
  'Bonafide Certificate',
  'Internship Certificate',
  'ID Proof',
  'Other University Documents',
];

router.get('/profile', authenticateToken, authorizeRole('Student'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -privateKeySimulated');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`[STUDENT] Profile retrieved for ${user.username}`);

    res.json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      studentId: user.studentId || 'N/A',
      department: user.department || 'N/A',
      registrationNumber: user.registrationNumber || 'N/A',
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('[STUDENT ERROR]', error.message);
    res.status(500).json({ message: 'Error retrieving profile', error: error.message });
  }
});

router.post('/upload-document', authenticateToken, authorizeRole('Student'), async (req, res) => {
  try {
    const { documentType, fileContent } = req.body;

    if (!documentType || !fileContent) {
      return res.status(400).json({ message: 'Document type and file content required' });
    }

    if (!DOCUMENT_TYPES.includes(documentType)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }

    const student = await User.findById(req.user.id);
    const faculty = await User.findOne({ role: 'Faculty' });

    if (!faculty) {
      return res.status(500).json({ message: 'No faculty available for encryption' });
    }

    const fileBuffer = Buffer.from(fileContent, 'base64');

    const { encryptedData, aesKey } = CryptoUtils.encryptFileAES256(fileBuffer);

    const encryptedAESKey = CryptoUtils.encryptAESKeyWithPublicKey(aesKey, faculty.publicKey);

    const fileHash = CryptoUtils.computeSHA256Hash(fileBuffer);

    const signature = CryptoUtils.signDataWithPrivateKey(fileHash, student.privateKeySimulated);

    const newDocument = new Document({
      studentId: req.user.id,
      studentName: student.fullName,
      documentType,
      encryptedFile: encryptedData,
      encryptedAESKey,
      hash: fileHash,
      digitalSignature: signature,
      status: 'Pending',
    });

    await newDocument.save();

    console.log(`[STUDENT] Document uploaded: ${documentType} by ${student.username}`);

    await ActivityLog.create({
      userId: req.user.id,
      username: student.username,
      role: 'Student',
      action: 'Upload',
      documentId: newDocument._id,
      details: `Uploaded ${documentType}`,
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: newDocument._id,
        documentType: newDocument.documentType,
        status: newDocument.status,
        uploadedAt: newDocument.uploadedAt,
      },
    });
  } catch (error) {
    console.error('[STUDENT ERROR]', error.message);
    res.status(500).json({ message: 'Document upload failed', error: error.message });
  }
});

router.get('/my-documents', authenticateToken, authorizeRole('Student'), async (req, res) => {
  try {
    const documents = await Document.find({ studentId: req.user.id }).sort({ uploadedAt: -1 });

    console.log(`[STUDENT] Retrieved ${documents.length} documents for ${req.user.username}`);

    res.json({
      documents: documents.map((doc) => ({
        id: doc._id,
        documentType: doc.documentType,
        status: doc.status,
        uploadedAt: doc.uploadedAt,
        remarks: doc.remarks,
        verifiedAt: doc.verifiedAt,
      })),
    });
  } catch (error) {
    console.error('[STUDENT ERROR]', error.message);
    res.status(500).json({ message: 'Error retrieving documents', error: error.message });
  }
});

module.exports = router;
