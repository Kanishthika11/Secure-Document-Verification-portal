'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  LogOut,
  User,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Shield,
  AlertCircle,
  Download,
} from 'lucide-react';

const DOCUMENT_TYPES = [
  {
    id: 'MARK_SHEET',
    name: 'Mark Sheets',
  },
  {
    id: 'DEGREE_CERT',
    name: 'Degree Certificate',
  },
  {
    id: 'BONAFIDE',
    name: 'Bonafide Certificate',
  },
  {
    id: 'INTERNSHIP',
    name: 'Internship Certificate',
  },
  {
    id: 'ID_PROOF',
    name: 'ID Proof',
  },
  {
    id: 'OTHER',
    name: 'Other Documents',
  },
];

interface Document {
  id: string;
  studentId: string;
  studentName: string;
  documentType: string;
  fileName: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  uploadedAt: string;
  remarks?: string;
  verifiedBy?: string;
}

export default function FacultyDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ pending: 0, verified: 0, rejected: 0 });
  const [selectedDocType, setSelectedDocType] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verifyStep, setVerifyStep] = useState(1); // 1 = checking, 2 = action
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(storedUser));
    fetchDocuments(token);
  }, [router]);

  useEffect(() => {
    if (selectedDocType === '') {
      setFilteredDocuments(documents);
    } else {
      setFilteredDocuments(documents.filter((doc) => doc.documentType === selectedDocType));
    }
  }, [documents, selectedDocType]);

  const fetchDocuments = async (token: string) => {
    try {
      const response = await axios.get('/api/faculty/assigned-documents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(response.data.documents);
      setStats({
        pending: response.data.pending,
        verified: response.data.verified,
        rejected: response.data.rejected,
      });
    } catch (err) {
      console.error('Fetch documents error:', err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (token: string) => {
    try {
      const response = await axios.get('/api/faculty/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data.profile);
    } catch (err) {
      console.error('Fetch profile error:', err);
    }
  };

  const handleVerifyClick = (doc: Document) => {
    setSelectedDocument(doc);
    setVerifyStep(1);
    setVerificationResult(null);
    setRemarks('');
    setShowVerificationModal(true);
    performVerification(doc.id);
  };

  const performVerification = async (documentId: string) => {
    setVerifying(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Step 1: Check integrity
      const response = await axios.post(
        '/api/faculty/verify-document',
        {
          documentId: documentId,
          step: 1,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setVerificationResult(response.data);
      setVerifyStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification check failed');
      console.error('Verification error:', err);
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyAction = async (action: 'approve' | 'reject') => {
    if (!selectedDocument || !verificationResult) return;

    // Validation
    if (action === 'reject' && !remarks.trim()) {
      setError('Please provide remarks before rejecting');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Step 2: Submit action
      const response = await axios.post(
        '/api/faculty/verify-document',
        {
          documentId: selectedDocument.id,
          step: 2,
          action,
          remarks: remarks || '',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // Show success message
      const actionText = action === 'approve' ? 'Approved' : 'Rejected';
      setSuccessMessage(`Document ${actionText} Successfully! ✓`);
      setShowSuccessModal(true);

      // Refresh documents after a short delay
      setTimeout(() => {
        fetchDocuments(token);
        setShowVerificationModal(false);
        setShowSuccessModal(false);
        setRemarks('');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Action failed');
      console.error('Action error:', err);
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    router.push('/auth/login');
  };

  const handleDownload = async (doc: Document) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    setError('');
    try {
      const response = await axios.get('/api/student/download-document', {
        params: { documentId: doc.id },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const disposition = response.headers['content-disposition'];
      const fileNameMatch = disposition?.match(/filename="?(.+?)"?$/);
      const fileName = fileNameMatch?.[1] || doc.fileName || `${doc.documentType?.replace(/_/g, '-') || 'document'}.pdf`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const blob = err.response?.data;
      const msg =
        blob instanceof Blob
          ? await new Promise<string>((res) => {
              const r = new FileReader();
              r.onload = () => {
                try {
                  const j = JSON.parse(r.result as string);
                  res(j.error || 'Download failed');
                } catch {
                  res('Download failed');
                }
              };
              r.readAsText(blob);
            })
          : err.response?.data?.error || 'Download failed';
      setError(msg);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Verified':
        return <CheckCircle className="text-green-400" size={20} />;
      case 'Pending':
        return <Clock className="text-yellow-400" size={20} />;
      case 'Rejected':
        return <XCircle className="text-red-400" size={20} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen page-gradient flex items-center justify-center">
        <div className="text-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-gradient">
      {/* Header */}
      <header className="card-elevated border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
            <Shield className="text-accent-foreground" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Faculty Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome, {user?.fullName}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const token = localStorage.getItem('token');
              if (token) fetchProfile(token);
              setShowProfileModal(true);
            }}
            className="px-4 py-2 hover:bg-card rounded-lg transition flex items-center gap-2"
          >
            <User size={20} className="text-accent" />
            <span className="text-foreground hidden sm:inline">Profile</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 hover:bg-card rounded-lg transition flex items-center gap-2"
          >
            <LogOut size={20} className="text-destructive" />
            <span className="text-foreground hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Clock className="text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold text-foreground">{stats.verified}</p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                <XCircle className="text-red-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Document Type Filter */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Document Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              onClick={() => setSelectedDocType('')}
              className={`p-4 rounded-lg border-2 transition text-center ${
                selectedDocType === ''
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary'
              }`}
            >
              <p className="text-sm font-semibold text-foreground">All Documents</p>
            </button>
            {DOCUMENT_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedDocType(type.id)}
                className={`p-4 rounded-lg border-2 transition text-center ${
                  selectedDocType === type.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary'
                }`}
              >
                <p className="text-sm font-semibold text-foreground">{type.name}</p>
              </button>
            ))}
          </div>
        </section>

        {/* Documents Table */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            {selectedDocType
              ? `${DOCUMENT_TYPES.find((t) => t.id === selectedDocType)?.name}`
              : 'All Documents'}
          </h2>
          {filteredDocuments.length === 0 ? (
            <div className="card-elevated p-8 text-center">
              <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
              <p className="text-muted-foreground">No documents found</p>
            </div>
          ) : (
            <div className="card-elevated overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Document
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Download
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="border-b border-border hover:bg-black/20">
                      <td className="px-6 py-4 text-sm text-foreground">{doc.studentName}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{doc.fileName}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{doc.documentType}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                            doc.status === 'Verified'
                              ? 'bg-green-500/20 text-green-300'
                              : doc.status === 'Rejected'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                          }`}
                        >
                          {getStatusIcon(doc.status)}
                          {doc.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => handleDownload(doc)}
                          title="Download document"
                          className="inline-flex items-center gap-2 text-accent hover:text-primary transition cursor-pointer"
                        >
                          <Download size={18} />
                          <span className="text-sm">Download</span>
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        {doc.status === 'Pending' ? (
                          <button
                            onClick={() => handleVerifyClick(doc)}
                            className="px-4 py-1 bg-primary text-white rounded transition text-sm cursor-pointer hover:bg-primary/80"
                          >
                            Verify
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {doc.status === 'Verified' ? 'Verified' : 'Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Profile Modal */}
      {showProfileModal && profile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card-elevated p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-foreground mb-6">Faculty Profile</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-black/20 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
                  <User className="text-accent-foreground" size={32} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="text-lg font-bold text-foreground">{profile.fullName}</p>
                </div>
              </div>
              <div className="p-4 bg-black/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-foreground font-mono">{profile.email}</p>
              </div>
              <div className="p-4 bg-black/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="text-foreground">{profile.username}</p>
              </div>
              <div className="p-4 bg-black/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Faculty ID</p>
                <p className="text-foreground font-mono">{profile.facultyId}</p>
              </div>
              <div className="p-4 bg-black/20 rounded-lg">
                <p className="text-sm text-muted-foreground">Joined</p>
                <p className="text-foreground">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full bg-secondary text-secondary-foreground py-2 rounded-lg transition cursor-pointer hover:opacity-80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Modal - Step 1: Check Results */}
      {showVerificationModal && selectedDocument && verifyStep === 1 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card-elevated p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">Checking Document Integrity...</h2>
            {verifying && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin">⏳</div>
                <span className="ml-4 text-foreground">Verifying document...</span>
              </div>
            )}
            {error && !verifying && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
                <p className="font-semibold mb-2">Verification Failed</p>
                <p className="text-sm">{error}</p>
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="mt-4 w-full bg-secondary text-secondary-foreground py-2 rounded-lg transition cursor-pointer hover:opacity-80"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Verification Modal - Step 2: Show Results & Remarks */}
      {showVerificationModal && selectedDocument && verifyStep === 2 && verificationResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card-elevated p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">Verification Results</h2>

            {/* Document Info */}
            <div className="bg-black/20 p-4 rounded-lg mb-6">
              <p className="text-sm text-muted-foreground">Document</p>
              <p className="text-lg font-semibold text-foreground">{selectedDocument.fileName}</p>
              <p className="text-sm text-muted-foreground mt-2">Student: {selectedDocument.studentName}</p>
            </div>

            {/* Verification Result Details */}
            <div className={`card-elevated p-6 border-2 mb-6 ${
              verificationResult.isSafe
                ? 'bg-green-500/10 border-green-500/50'
                : 'bg-red-500/10 border-red-500/50'
            }`}>
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                {verificationResult.isSafe ? (
                  <>
                    <CheckCircle size={20} className="text-green-400" />
                    Document Integrity: VALID ✅
                  </>
                ) : (
                  <>
                    <AlertCircle size={20} className="text-red-400" />
                    Document Integrity: INVALID ❌
                  </>
                )}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-black/20 rounded">
                  <span className="text-muted-foreground">Hash Check:</span>
                  <span
                    className={`font-mono text-sm font-semibold ${
                      verificationResult.hashMatch ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {verificationResult.hashMatch ? 'VALID ✓' : 'FAILED ✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/20 rounded">
                  <span className="text-muted-foreground">Digital Signature:</span>
                  <span
                    className={`font-mono text-sm font-semibold ${
                      verificationResult.signatureValid ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {verificationResult.signatureValid ? 'VALID ✓' : 'FAILED ✗'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-black/20 rounded">
                  <span className="text-muted-foreground">Overall Status:</span>
                  <span
                    className={`font-mono text-sm font-semibold ${
                      verificationResult.isSafe ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {verificationResult.isSafe ? 'SAFE ✓' : 'TAMPERED ✗'}
                  </span>
                </div>
              </div>
            </div>

            {/* Remarks Section */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-foreground mb-2">
                {verificationResult.isSafe
                  ? 'Remarks (Optional - For approval notes)'
                  : 'Remarks (Required - Reason for rejection)'}
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={
                  verificationResult.isSafe
                    ? 'Add any notes about the document...'
                    : 'Explain why this document is being rejected...'
                }
                className="w-full px-4 py-3 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {verificationResult.isSafe ? (
                <>
                  <button
                    onClick={() => handleVerifyAction('approve')}
                    disabled={verifying}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg disabled:opacity-50 transition font-medium cursor-pointer hover:bg-green-700"
                  >
                    {verifying ? 'Approving...' : '✓ Approve Document'}
                  </button>
                  <button
                    onClick={() => handleVerifyAction('reject')}
                    disabled={verifying}
                    className="flex-1 bg-red-600 text-white py-3 rounded-lg disabled:opacity-50 transition font-medium cursor-pointer hover:bg-red-700"
                  >
                    {verifying ? 'Processing...' : '✗ Reject Document'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleVerifyAction('reject')}
                  disabled={verifying || !remarks.trim()}
                  className="flex-1 bg-red-600 text-white py-3 rounded-lg disabled:opacity-50 transition font-medium cursor-pointer hover:bg-red-700"
                >
                  {verifying ? 'Rejecting...' : '✗ Reject Document'}
                </button>
              )}
              <button
                onClick={() => setShowVerificationModal(false)}
                disabled={verifying}
                className="flex-1 bg-secondary text-secondary-foreground py-3 rounded-lg disabled:opacity-50 transition cursor-pointer hover:opacity-80"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card-elevated p-8 max-w-md w-full text-center">
            <div className="mb-4 text-5xl">✅</div>
            <h2 className="text-2xl font-bold text-green-400 mb-4">{successMessage}</h2>
            <p className="text-muted-foreground mb-6">The document status has been updated and the list will refresh.</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-primary text-white py-2 rounded-lg transition cursor-pointer hover:opacity-80"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
