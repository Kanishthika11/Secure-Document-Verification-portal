'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';

export const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student');
  const [department, setDepartment] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        fullName,
        email,
        username,
        password,
        role,
      };

      if (role === 'Student') {
        payload.department = department;
        payload.registrationNumber = registrationNumber;
      }

      await apiClient.post('/auth/register', payload);

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form className="form-container" onSubmit={handleRegister}>
        <div className="form-title">Register</div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="input-group">
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)} required>
            <option value="Student">Student</option>
            <option value="Faculty">Faculty</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        {role === 'Student' && (
          <>
            <div className="input-group">
              <label>Department</label>
              <input
                type="text"
                placeholder="e.g., Computer Science"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Registration Number</label>
              <input
                type="text"
                placeholder="e.g., CSE001"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                required
              />
            </div>
          </>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

        <div className="form-footer">
          Already have an account? <a href="/login">Login here</a>
        </div>
      </form>
    </div>
  );
};
