const express = require('express');
const User = require('../models/User');
const Document = require('../models/Document');
const ActivityLog = require('../models/ActivityLog');
const CryptoUtils = require('../utils/cryptoUtils');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/assigned-documents', authenticateToken, authorizeRole('Faculty'), async (req, res) => {
  try {
    const documents = await Document.find().populate('studentId', 'fullName email username').sort({ uploadedAt: -1 });

    console.log(`[FACULTY] Retrieved ${documents.length} documents`);

    res.json({
      documents: documents.map((doc) => ({
        id: doc._id,
        studentName: doc.studentName,
        studentId: doc.studentId,
        documentType: doc.documentType,
        status: doc.status,
        uploadedAt: doc.uploadedAt,
        remarks: doc.remarks,
      })),
    });
  } catch (error) {
    console.error('[FACULTY ERROR]', error.message);
    res.status(500).json({ message: 'Error retrieving documents', error: error.message });
  }
});

router.post('/verify-document', authenticateToken, authorizeRole('Faculty'), async (req, res) => {
  try {
    const { documentId, action, remarks } = req.body;

    if (!documentId || !action) {
      return res.status(400).json({ message: 'Document ID and action required' });
    }

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const faculty = await User.findById(req.user.id);
    const student = await User.findById(document.studentId);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    let isTampered = false;
    let signatureValid = false;

    try {
      const decryptedAESKey = CryptoUtils.decryptAESKeyWithPrivateKey(
        document.encryptedAESKey,
        faculty.privateKeySimulated
      );

      const decryptedFile = CryptoUtils.decryptFileAES256(document.encryptedFile, decryptedAESKey);

      const computedHash = CryptoUtils.computeSHA256Hash(decryptedFile);

      if (computedHash !== document.hash) {
        isTampered = true;
        console.log('[FACULTY] Document tampering detected!');
      }

      signatureValid = CryptoUtils.verifySignatureWithPublicKey(
        document.hash,
        document.digitalSignature,
        student.publicKey
      );

      console.log(`[FACULTY] Verification result: Tampered=${isTampered}, SignatureValid=${signatureValid}`);
    } catch (error) {
      console.error('[FACULTY VERIFICATION ERROR]', error.message);
      isTampered = true;
    }

    if (isTampered) {
      return res.status(400).json({
        message: 'Document verification failed: Tampering detected',
        tampered: true,
        signatureValid,
      });
    }

    const newStatus = action === 'approve' ? 'Verified' : 'Rejected';
    document.status = newStatus;
    document.remarks = remarks || '';
    document.verifiedBy = req.user.id;
    document.verifiedAt = new Date();

    await document.save();

    console.log(`[FACULTY] Document ${newStatus}: ${documentId} by ${faculty.username}`);

    await ActivityLog.create({
      userId: req.user.id,
      username: faculty.username,
      role: 'Faculty',
      action: action === 'approve' ? 'Approve' : 'Reject',
      documentId: document._id,
      details: `${newStatus} - ${document.documentType}. Remarks: ${remarks || 'None'}`,
    });

    res.json({
      message: `Document ${newStatus.toLowerCase()}`,
      document: {
        id: document._id,
        status: document.status,
        remarks: document.remarks,
        tampered: isTampered,
        signatureValid,
      },
    });
  } catch (error) {
    console.error('[FACULTY ERROR]', error.message);
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
});

module.exports = router;
