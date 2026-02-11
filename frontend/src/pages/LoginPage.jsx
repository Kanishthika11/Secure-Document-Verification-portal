'use client';

import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { AuthContext } from '../context/AuthContext';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/login', { username, password });
      sessionStorage.setItem('userId', response.data.userId);
      sessionStorage.setItem('otp', response.data.otp);
      navigate(`/verify-otp/${response.data.userId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form className="form-container" onSubmit={handleLogin}>
        <div className="form-title">Login</div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="input-group">
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        <div className="form-footer">
          Don't have an account? <a href="/register">Register here</a>
        </div>
      </form>
    </div>
  );
};
