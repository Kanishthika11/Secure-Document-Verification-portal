'use client';

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { AuthContext } from '../context/AuthContext';

const DOCUMENT_TYPES = ['Mark Sheets', 'Degree Certificate', 'Bonafide Certificate', 'Internship Certificate', 'ID Proof', 'Other University Documents'];

export const FacultyDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await apiClient.get('/faculty/assigned-documents');
      setDocuments(response.data.documents);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setLoading(false);
    }
  };

  const filteredDocuments = selectedDocType === '' ? documents : documents.filter((d) => d.documentType === selectedDocType);

  const handleVerifyClick = (doc) => {
    setSelectedDoc(doc);
    setRemarks('');
    setVerificationResult(null);
    setShowVerificationModal(true);
  };

  const handleVerifyAction = async (action) => {
    setError('');
    setVerifying(true);

    try {
      const response = await apiClient.post('/faculty/verify-document', {
        documentId: selectedDoc.id,
        action,
        remarks,
      });

      setVerificationResult({
        success: true,
        message: response.data.message,
        tampered: response.data.tampered,
        signatureValid: response.data.signatureValid,
      });

      setTimeout(() => {
        setShowVerificationModal(false);
        fetchDocuments();
      }, 2000);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Verification failed';
      setVerificationResult({
        success: false,
        message: errorMsg,
        tampered: err.response?.data?.tampered || false,
        signatureValid: err.response?.data?.signatureValid,
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-logo">Document Portal - Faculty</div>
        <div className="navbar-menu">
          <div className="profile-icon">{user?.username?.charAt(0).toUpperCase()}</div>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </nav>

      <div className="container">
        <div className="dashboard-header">
          <div className="dashboard-title">Faculty Dashboard</div>
        </div>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>Filter by Document Type</h2>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedDocType('')}
              className={`btn ${selectedDocType === '' ? 'btn-primary' : 'btn-secondary'}`}
            >
              All Documents ({documents.length})
            </button>
            {DOCUMENT_TYPES.map((docType) => (
              <button
                key={docType}
                onClick={() => setSelectedDocType(docType)}
                className={`btn ${selectedDocType === docType ? 'btn-primary' : 'btn-secondary'}`}
              >
                {docType} ({documents.filter((d) => d.documentType === docType).length})
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>Documents for Verification</h2>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No documents to verify</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Document Type</th>
                  <th>Status</th>
                  <th>Uploaded Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.studentName}</td>
                    <td>{doc.documentType}</td>
                    <td>
                      <span className={`status-badge status-${doc.status.toLowerCase()}`}>{doc.status}</span>
                    </td>
                    <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                    <td>
                      {doc.status === 'Pending' ? (
                        <button className="btn btn-primary" onClick={() => handleVerifyClick(doc)} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                          Verify
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showVerificationModal && selectedDoc && (
        <div className="modal" onClick={() => setShowVerificationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">Verify Document</div>

            {verificationResult ? (
              <div style={{ textAlign: 'center' }}>
                <div className={`alert ${verificationResult.success ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: '1rem' }}>
                  {verificationResult.message}
                </div>

                {!verificationResult.success && verificationResult.tampered && (
                  <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                    WARNING: Document tampering detected! File integrity check failed.
                  </div>
                )}

                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  <p>Signature Valid: {verificationResult.signatureValid ? 'Yes' : 'No'}</p>
                  <p>Document Tampered: {verificationResult.tampered ? 'Yes' : 'No'}</p>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <p><strong>Student:</strong> {selectedDoc.studentName}</p>
                  <p><strong>Document Type:</strong> {selectedDoc.documentType}</p>
                  <p><strong>Uploaded:</strong> {new Date(selectedDoc.uploadedAt).toLocaleString()}</p>
                </div>

                <div className="input-group">
                  <label>Verification Remarks</label>
                  <textarea
                    placeholder="Add any remarks about this document verification"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows="3"
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleVerifyAction('approve')}
                    disabled={verifying}
                  >
                    {verifying ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleVerifyAction('reject')}
                    disabled={verifying}
                  >
                    {verifying ? 'Processing...' : 'Reject'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowVerificationModal(false)}
                    disabled={verifying}
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
