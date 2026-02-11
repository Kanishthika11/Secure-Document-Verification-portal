'use client';

import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { AuthContext } from '../context/AuthContext';

export const OTPPage = () => {
  const { userId } = useParams();
  const userIdFromSession = sessionStorage.getItem('userId');
  const otpFromLogin = sessionStorage.getItem('otp');
  
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(120);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    if (!userIdFromSession) {
      setError('Session expired. Please login again.');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [navigate, userIdFromSession]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (otp.length !== 6) {
      setError('OTP must be exactly 6 digits');
      setLoading(false);
      return;
    }

    if (timer === 0) {
      setError('OTP has expired. Please login again.');
      setLoading(false);
      return;
    }

    try {
      console.log('[FRONTEND] Verifying OTP with userId:', userIdFromSession, 'OTP:', otp);
      
      const response = await apiClient.post('/auth/verify-otp', {
        userId: userIdFromSession || userId,
        otp,
      });

      console.log('[FRONTEND] OTP verification successful:', response.data);

      login(response.data.user, response.data.token);
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('otp');

      const route = response.data.user.role === 'Student' ? '/student' : 
                   response.data.user.role === 'Faculty' ? '/faculty' : '/admin';
      navigate(route);
    } catch (err) {
      console.error('[FRONTEND] OTP verification error:', err.response?.data);
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setTimer(120);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <form className="form-container" onSubmit={handleVerifyOTP}>
        <div className="form-title">Multi-Factor Authentication</div>

        <div style={{ 
          backgroundColor: 'rgba(76, 175, 80, 0.1)', 
          border: '1px solid #4CAF50', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0', fontSize: '0.95rem' }}>
            <strong>A 6-digit OTP has been generated.</strong>
          </p>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0', fontSize: '0.9rem' }}>
            Check the <strong>Node.js backend console</strong> to see the OTP code.
          </p>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0', fontSize: '0.9rem' }}>
            Look for: <code style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '3px' }}>OTP CODE: 123456</code>
          </p>
        </div>

        {otpFromLogin && (
          <div style={{ 
            backgroundColor: 'rgba(255, 193, 7, 0.1)', 
            border: '1px solid #FFC107', 
            padding: '1rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0', fontSize: '0.9rem' }}>
              <strong>For Testing:</strong> OTP from login = {otpFromLogin}
            </p>
          </div>
        )}

        {error && <div className="alert alert-error">{error}</div>}

        <div className="input-group">
          <label>Enter 6-Digit OTP</label>
          <input
            type="text"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength="6"
            required
            autoFocus
            style={{ fontSize: '1.5rem', letterSpacing: '8px', textAlign: 'center' }}
          />
        </div>

        <div style={{ 
          textAlign: 'center', 
          color: timer > 30 ? 'var(--text-muted)' : timer > 10 ? '#ff9800' : '#f44336', 
          marginBottom: '1rem', 
          fontWeight: '600',
          fontSize: '1.1rem'
        }}>
          {timer > 0 ? `Time remaining: ${timer}s` : '⏱ OTP Expired'}
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', padding: '0.75rem' }} 
          disabled={loading || timer === 0 || otp.length !== 6}
        >
          {loading ? 'Verifying OTP...' : 'Verify & Sign In'}
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem' }}
          onClick={handleResendOTP}
          disabled={loading}
        >
          Request New OTP
        </button>

        <div className="form-footer">
          <a href="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Back to Login</a>
        </div>
      </form>
    </div>
  );
};
