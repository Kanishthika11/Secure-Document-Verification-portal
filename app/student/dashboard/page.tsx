'use client';

import React from "react"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import {
  LogOut,
  Upload,
  User,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Trash2,
} from 'lucide-react';

const DOCUMENT_TYPES = [
  {
    id: 'MARK_SHEET',
    name: 'Mark Sheets',
    icon: FileText,
    description: 'Academic performance records',
  },
  {
    id: 'DEGREE_CERT',
    name: 'Degree Certificate',
    icon: FileText,
    description: 'Official degree certificate',
  },
  {
    id: 'BONAFIDE',
    name: 'Bonafide Certificate',
    icon: FileText,
    description: 'Student bonafide certificate',
  },
  {
    id: 'INTERNSHIP',
    name: 'Internship Certificate',
    icon: FileText,
    description: 'Internship completion certificate',
  },
  {
    id: 'ID_PROOF',
    name: 'ID Proof',
    icon: FileText,
    description: 'College ID or identity proof',
  },
  {
    id: 'OTHER',
    name: 'Other Documents',
    icon: FileText,
    description: 'Other university-issued documents',
  },
];

interface Document {
  id: string;
  documentType: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  uploadedAt: string;
  remarks?: string;
  verifiedBy?: string;
  fileName?: string;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

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

  const fetchDocuments = async (token: string) => {
    try {
      const response = await axios.get('/api/student/my-documents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocuments(response.data.documents);
    } catch (err) {
      console.error('[v0] Fetch documents error:', err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (token: string) => {
    try {
      const response = await axios.get('/api/student/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data.profile);
    } catch (err) {
      console.error('[v0] Fetch profile error:', err);
    }
  };

  const handleUploadClick = (docType: string) => {
    setSelectedDocType(docType);
    setShowUploadModal(true);
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploading(true);

    const fileInput = e.currentTarget.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];

    if (!file || !selectedDocType) {
      setError('Please select a file');
      setUploading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', selectedDocType);

      const response = await axios.post('/api/student/upload-document', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess('Document uploaded successfully');
      setShowUploadModal(false);
      setSelectedDocType('');
      fileInput.value = '';

      // Refresh documents
      await fetchDocuments(token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
      console.error('[v0] Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    router.push('/auth/login');
  };

  const handleDownload = async (doc: Document) => {
    if (doc.status !== 'Verified') return;

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
      const fileName = fileNameMatch?.[1] || doc.fileName || `${doc.documentType.replace(/_/g, '-')}.pdf`;

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
      const msg = blob instanceof Blob
        ? (await new Promise<string>((res) => {
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
        }))
        : (err.response?.data?.error || 'Download failed');
      setError(msg);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm('Are you sure you want to remove this document?')) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setError('');
    setSuccess('');
    try {
      await axios.post('/api/student/delete-document',
        { documentId: docId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Document removed successfully');
      fetchDocuments(token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove document');
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
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
            <User className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Student Dashboard</h1>
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

        {success && (
          <div className="bg-green-500/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Upload Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Upload Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DOCUMENT_TYPES.map((docType) => {
              const IconComponent = docType.icon;
              return (
                <button
                  key={docType.id}
                  onClick={() => handleUploadClick(docType.id)}
                  className="card-elevated p-6 hover:border-accent hover:bg-card/50 transition group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/40 transition">
                      <IconComponent className="text-accent" size={24} />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-foreground mb-1">{docType.name}</h3>
                      <p className="text-xs text-muted-foreground">{docType.description}</p>
                    </div>
                    <Upload size={18} className="text-muted-foreground" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Documents List */}
        <section>
          <h2 className="text-2xl font-bold text-foreground mb-6">Your Documents</h2>
          {documents.length === 0 ? (
            <div className="card-elevated p-12 text-center">
              <FileText className="mx-auto mb-4 text-muted-foreground" size={48} />
              <p className="text-muted-foreground">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="card-elevated overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Document Type
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Document Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Upload Date
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Remarks
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-card/50 transition">
                        <td className="px-6 py-4 text-sm text-foreground">
                          {doc.documentType.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground font-medium">
                          {doc.fileName || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(doc.status)}
                            <span
                              className={`text-sm font-medium ${doc.status === 'Verified'
                                  ? 'text-green-400'
                                  : doc.status === 'Pending'
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                                }`}
                            >
                              {doc.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {doc.remarks ? (
                            <div className={`px-3 py-2 rounded ${doc.status === 'Rejected'
                                ? 'bg-red-500/20 text-red-200 border border-red-500/30'
                                : 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
                              }`}>
                              {doc.remarks}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => handleDownload(doc)}
                              disabled={doc.status !== 'Verified'}
                              title={doc.status === 'Verified' ? 'Download document' : 'Available after verification'}
                              className={`flex items-center gap-2 transition ${doc.status === 'Verified'
                                  ? 'text-accent hover:text-primary cursor-pointer'
                                  : 'text-muted-foreground cursor-not-allowed opacity-60'
                                }`}
                            >
                              <Download size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(doc.id)}
                              title="Remove document"
                              className="text-destructive hover:text-red-400 transition cursor-pointer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card-elevated p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-foreground mb-6">Student Profile</h2>
            {profile ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">Full Name</label>
                  <p className="text-foreground font-medium">{profile.fullName}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Student ID</label>
                  <p className="text-foreground font-medium">{profile.studentId}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Email</label>
                  <p className="text-foreground font-medium">{profile.email}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Department</label>
                  <p className="text-foreground font-medium">{profile.department}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Registration Number</label>
                  <p className="text-foreground font-medium">{profile.registrationNumber}</p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Member Since</label>
                  <p className="text-foreground font-medium">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">Loading profile...</p>
            )}
            <button
              onClick={() => setShowProfileModal(false)}
              className="w-full mt-6 bg-primary text-white py-2 rounded-lg transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card-elevated p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-foreground mb-6">Upload Document</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select File
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg cursor-pointer"
                  disabled={uploading}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-primary text-white py-2 rounded-lg disabled:opacity-50 transition cursor-pointer"
                >
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    setSelectedDocType('');
                  }}
                  disabled={uploading}
                  className="flex-1 bg-secondary text-secondary-foreground py-2 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
