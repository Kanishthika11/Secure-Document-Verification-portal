'use client';

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { AuthContext } from '../context/AuthContext';

export const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [docStats, setDocStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [usersRes, logsRes, docStatsRes] = await Promise.all([
        apiClient.get('/admin/all-users'),
        apiClient.get('/admin/activity-logs'),
        apiClient.get('/admin/document-stats'),
      ]);

      setUsers(usersRes.data.users);
      setStats(usersRes.data.stats);
      setLogs(logsRes.data.logs);
      setDocStats(docStatsRes.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div>
        <nav className="navbar">
          <div className="navbar-logo">Document Portal - Admin</div>
        </nav>
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <nav className="navbar">
        <div className="navbar-logo">Document Portal - Admin</div>
        <div className="navbar-menu">
          <div className="profile-icon">{user?.username?.charAt(0).toUpperCase()}</div>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </nav>

      <div className="container">
        <div className="dashboard-header">
          <div className="dashboard-title">Admin Dashboard</div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`btn ${activeTab === 'logs' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Activity Logs
          </button>
        </div>

        {activeTab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {stats && [
                { label: 'Total Users', value: stats.totalUsers, color: 'var(--primary-color)' },
                { label: 'Students', value: stats.students, color: 'var(--accent-color)' },
                { label: 'Faculty', value: stats.faculty, color: 'var(--success)' },
                { label: 'Admins', value: stats.admins, color: 'var(--warning)' },
              ].map((stat) => (
                <div key={stat.label} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${stat.color}` }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              {docStats && [
                { label: 'Total Documents', value: docStats.totalDocuments, color: 'var(--primary-color)' },
                { label: 'Pending', value: docStats.pending, color: 'var(--warning)' },
                { label: 'Verified', value: docStats.verified, color: 'var(--success)' },
                { label: 'Rejected', value: docStats.rejected, color: 'var(--danger)' },
              ].map((stat) => (
                <div key={stat.label} className="card" style={{ textAlign: 'center', borderTop: `3px solid ${stat.color}` }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                  <div style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="card">
            <h2 style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>All Users</h2>
            {users.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No users found</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.fullName}</td>
                      <td>{u.username}</td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>
                        <span style={{ color: u.isActive ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                          {u.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="card">
            <h2 style={{ color: 'var(--accent-color)', marginBottom: '1rem' }}>Activity Logs</h2>
            {logs.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No activity logs</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td>{log.username}</td>
                      <td>{log.role}</td>
                      <td>
                        <span style={{ background: 'rgba(74, 144, 226, 0.2)', color: 'var(--accent-color)', padding: '0.25rem 0.75rem', borderRadius: '0.25rem', fontSize: '0.85rem', fontWeight: '600' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{log.details}</td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
