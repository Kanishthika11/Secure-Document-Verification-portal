'use client';

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { AuthContext } from '../context/AuthContext';

const DOCUMENT_TYPES = [
  { id: 1, name: 'Mark Sheets', description: 'Academic mark sheets and transcripts' },
  { id: 2, name: 'Degree Certificate', description: 'Official degree certificate' },
  { id: 3, name: 'Bonafide Certificate', description: 'College bonafide certificate' },
  { id: 4, name: 'Internship Certificate', description: 'Internship completion certificate' },
  { id: 5, name: 'ID Proof', description: 'College or government issued ID' },
  { id: 6, name: 'Other University Documents', description: 'Other relevant documents' },
];

export const StudentDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
    fetchDocuments();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/student/profile');
      setProfile(response.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await apiClient.get('/student/my-documents');
      setDocuments(response.data.documents);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }
    setFile(selectedFile);
    setError('');
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    if (!file || !selectedDocType) {
      setError('Please select a file and document type');
      setUploading(false);
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const fileContent = event.target.result.split(',')[1];

        await apiClient.post('/student/upload-document', {
          documentType: selectedDocType,
          fileContent,
        });

        setShowUploadModal(false);
        setSelectedDocType(null);
        setFile(null);
        fetchDocuments();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-logo">Document Portal</div>
        <div className="navbar-menu">
          <div className="profile-icon" onClick={() => setShowProfileModal(true)}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </nav>

      <div className="container">
        <div className="dashboard-header">
          <div className="dashboard-title">Student Dashboard</div>
        </div>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>Upload Documents</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Click on any document type to upload your files securely
          </p>

          <div className="document-cards">
            {DOCUMENT_TYPES.map((docType) => (
              <div key={docType.id} className="document-card" onClick={() => {
                setSelectedDocType(docType.name);
                setShowUploadModal(true);
              }}>
                <div className="document-card-title">{docType.name}</div>
                <div className="document-card-desc">{docType.description}</div>
                <button type="button" className="btn btn-primary">Upload</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>Your Documents</h2>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : documents.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No documents uploaded yet</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Document Type</th>
                  <th>Status</th>
                  <th>Uploaded Date</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.documentType}</td>
                    <td>
                      <span className={`status-badge status-${doc.status.toLowerCase()}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                    <td>{doc.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showProfileModal && (
        <div className="modal" onClick={() => setShowProfileModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">Profile</div>

            {profile && (
              <div className="profile-modal-content">
                <div className="profile-field">
                  <span className="profile-field-label">Full Name</span>
                  <span className="profile-field-value">{profile.fullName}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Email</span>
                  <span className="profile-field-value">{profile.email}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Username</span>
                  <span className="profile-field-value">{profile.username}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Student ID</span>
                  <span className="profile-field-value">{profile.studentId}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Department</span>
                  <span className="profile-field-value">{profile.department}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Registration Number</span>
                  <span className="profile-field-value">{profile.registrationNumber}</span>
                </div>
                <div className="profile-field">
                  <span className="profile-field-label">Member Since</span>
                  <span className="profile-field-value">{new Date(profile.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowProfileModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showUploadModal && (
        <div className="modal" onClick={() => { setShowUploadModal(false); setFile(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">Upload Document: {selectedDocType}</div>

            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleUploadDocument}>
              <div className="input-group">
                <label>Select PDF File</label>
                <input type="file" accept=".pdf" onChange={handleFileChange} required />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowUploadModal(false); setFile(null); }} disabled={uploading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={uploading || !file}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
