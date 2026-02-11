'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { LogOut, Users, Activity, Lock, AlertCircle, User, FileText, CheckCircle, Clock, XCircle, Download, Trash2 } from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Document {
  id: string;
  studentName: string;
  fileName: string;
  documentType: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  uploadedAt: string;
  remarks?: string;
  verifiedBy?: string;
}

interface ActivityLog {
  id: string;
  action: string;
  userId: string;
  userName: string;
  userRole: string;
  resourceType: string;
  timestamp: string;
  details: Record<string, any>;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ 
    students: 0, 
    faculty: 0, 
    admins: 0, 
    totalLogs: 0,
    totalDocuments: 0,
    pendingDocs: 0,
    verifiedDocs: 0,
  });
  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/auth/login');
      return;
    }

    const userObj = JSON.parse(storedUser);
    if (userObj.role !== 'admin') {
      router.push('/student/dashboard');
      return;
    }

    setUser(userObj);
    fetchData(token);
  }, [router]);

  const fetchData = async (token: string) => {
    try {
      const [usersRes, logsRes, docsRes] = await Promise.all([
        axios.get('/api/admin/all-users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('/api/admin/activity-logs', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('/api/admin/all-documents', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => ({ data: { documents: [] } })),
      ]);

      setUsers(usersRes.data.users);
      setLogs(logsRes.data.logs);
      setDocuments(docsRes.data.documents || []);
      setStats({
        students: usersRes.data.roleCount.students,
        faculty: usersRes.data.roleCount.faculty,
        admins: usersRes.data.roleCount.admins,
        totalLogs: logsRes.data.totalCount,
        totalDocuments: docsRes.data.documents?.length || 0,
        pendingDocs: docsRes.data.documents?.filter((d: any) => d.status === 'Pending').length || 0,
        verifiedDocs: docsRes.data.documents?.filter((d: any) => d.status === 'Verified').length || 0,
      });
    } catch (err) {
      console.error('Fetch data error:', err);
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        router.push('/auth/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (token: string) => {
    try {
      const response = await axios.get('/api/admin/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(response.data.profile);
    } catch (err) {
      console.error('Fetch profile error:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();
    router.push('/auth/login');
  };

  const handleRemoveUser = async (userId: string, username: string, role: string) => {
    if (role === 'admin') return;
    const isStudent = role === 'student';
    const msg = isStudent
      ? `Remove "${username}"? Their account and all uploaded documents will be deleted.`
      : `Remove "${username}"? Documents they verified will be set back to Pending.`;
    if (!confirm(msg)) return;

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    setRemovingUserId(userId);
    setError('');

    try {
      const response = await axios.post(
        '/api/admin/remove-user',
        { userId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.status === 200 && response.data?.message) {
        // Remove user from table immediately so row disappears
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        // Update stats counts
        if (role === 'student') {
          setStats((s) => ({ ...s, students: Math.max(0, s.students - 1) }));
        } else if (role === 'faculty') {
          setStats((s) => ({ ...s, faculty: Math.max(0, s.faculty - 1) }));
        }
        // Refetch all data so documents list and stats stay in sync
        await fetchData(token);
      } else {
        setError(response.data?.error || 'Failed to remove user');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to remove user';
      setError(msg);
    } finally {
      setRemovingUserId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Verified':
        return <CheckCircle className="text-green-400" size={18} />;
      case 'Pending':
        return <Clock className="text-yellow-400" size={18} />;
      case 'Rejected':
        return <XCircle className="text-red-400" size={18} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen page-gradient flex items-center justify-center">
        <div className="text-foreground">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-gradient">
      {/* Header */}
      <header className="card-elevated border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center">
            <Lock className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Administration Dashboard</h1>
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
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">
                  {stats.students + stats.faculty + stats.admins}
                </p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Users className="text-green-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Students</p>
                <p className="text-2xl font-bold text-foreground">{stats.students}</p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Users className="text-purple-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Faculty</p>
                <p className="text-2xl font-bold text-foreground">{stats.faculty}</p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Activity className="text-orange-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activity Logs</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalLogs}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Document Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <FileText className="text-blue-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalDocuments}</p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <Clock className="text-yellow-400" size={24} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold text-foreground">{stats.pendingDocs}</p>
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
                <p className="text-2xl font-bold text-foreground">{stats.verifiedDocs}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium transition border-b-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2 font-medium transition border-b-2 whitespace-nowrap ${
              activeTab === 'documents'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Documents
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 font-medium transition border-b-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 font-medium transition border-b-2 whitespace-nowrap ${
              activeTab === 'logs'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Activity Logs
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <section className="space-y-6">
            <div className="card-elevated p-6 border border-amber-500/30 bg-amber-500/5">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-amber-400 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h3 className="font-semibold text-amber-200 mb-2">System Information</h3>
                  <ul className="text-sm text-amber-200 space-y-1">
                    <li>• Role-based access control enabled</li>
                    <li>• All user activities are logged for audit purposes</li>
                    <li>• Documents are encrypted with AES-256</li>
                    <li>• Digital signatures verify document authenticity</li>
                    <li>• Admin can monitor and manage all system resources</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card-elevated p-6">
                <h3 className="font-semibold text-foreground mb-4">Security Policies</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    <span>Passwords hashed with bcryptjs (10-salt rounds)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    <span>Multi-factor authentication via OTP</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    <span>JWT tokens with 24-hour expiration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    <span>RSA 2048-bit key exchange</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    <span>SHA-256 hashing for integrity verification</span>
                  </li>
                </ul>
              </div>

              <div className="card-elevated p-6">
                <h3 className="font-semibold text-foreground mb-4">Document Security</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    <span>AES-256 CBC mode encryption</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    <span>RSA encrypted session keys</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    <span>Digital signatures prevent tampering</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    <span>Integrity verification during download</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-accent">•</span>
                    <span>Audit trail for all document operations</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">All Documents</h2>
            <div className="card-elevated overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        File Name
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
                        Remarks
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-card/50 transition">
                        <td className="px-6 py-4 text-sm text-foreground font-medium">
                          {doc.studentName}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{doc.fileName}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{doc.documentType}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className="inline-flex items-center gap-2">
                            {getStatusIcon(doc.status)}
                            <span
                              className={
                                doc.status === 'Verified'
                                  ? 'text-green-300'
                                  : doc.status === 'Rejected'
                                    ? 'text-red-300'
                                    : 'text-yellow-300'
                              }
                            >
                              {doc.status}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {doc.remarks || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">User Management</h2>
            <div className="card-elevated overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Joined
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-card/50 transition">
                        <td className="px-6 py-4 text-sm text-foreground font-medium">
                          {u.fullName}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{u.username}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{u.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              u.role === 'student'
                                ? 'bg-blue-500/20 text-blue-200'
                                : u.role === 'faculty'
                                  ? 'bg-purple-500/20 text-purple-200'
                                  : 'bg-red-500/20 text-red-200'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {(u.role === 'student' || u.role === 'faculty') ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveUser(u.id, u.username, u.role)}
                              disabled={removingUserId === u.id}
                              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-200 hover:bg-red-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Remove user"
                            >
                              <Trash2 size={16} />
                              {removingUserId === u.id ? 'Removing...' : 'Remove'}
                            </button>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">Activity Logs</h2>
            <div className="card-elevated overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-card border-b border-border">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                        Resource
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-card/50 transition">
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{log.userName}</td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              log.userRole === 'student'
                                ? 'bg-blue-500/20 text-blue-200'
                                : log.userRole === 'faculty'
                                  ? 'bg-purple-500/20 text-purple-200'
                                  : 'bg-red-500/20 text-red-200'
                            }`}
                          >
                            {log.userRole}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground">{log.action}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{log.resourceType}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Profile Modal */}
      {showProfileModal && profile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card-elevated p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-foreground mb-6">Admin Profile</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-black/20 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                  <Lock className="text-white" size={32} />
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
                <p className="text-sm text-muted-foreground">Admin ID</p>
                <p className="text-foreground font-mono">{profile.adminId}</p>
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
    </div>
  );
}
