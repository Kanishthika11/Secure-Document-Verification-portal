'use client';

import React from "react"

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Lock, ArrowRight } from 'lucide-react';

function OTPVerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!userId || otp.length !== 6) {
        setError('Please enter a valid 6-digit OTP');
        setLoading(false);
        return;
      }

      const response = await axios.post('/api/auth/verify-otp', {
        userId,
        otp,
      });

      // Store token
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect based on role
      const role = response.data.user.role;
      if (role === 'student') {
        router.push('/student/dashboard');
      } else if (role === 'faculty') {
        router.push('/faculty/dashboard');
      } else if (role === 'admin') {
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'OTP verification failed');
      console.error('[v0] OTP verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen page-gradient flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
              <Lock className="text-accent-foreground" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Verify Your Identity</h1>
          <p className="text-muted-foreground">Enter the 6-digit code sent to your email</p>
        </div>

        {/* OTP Card */}
        <div className="card-elevated p-8 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-6">One-Time Password</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">
                Enter OTP Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-3 bg-input border border-border text-foreground text-2xl tracking-widest text-center rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Time remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Debug OTP Display */}
          <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-200">
              Demo Mode: Check your browser console or terminal for OTP code
            </p>
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-card/50 border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-accent mb-2">Multi-Factor Authentication</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• 6-digit OTP valid for 2 minutes</li>
            <li>• Provides additional security layer</li>
            <li>• Prevents unauthorized access</li>
            <li>• Industry-standard MFA implementation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={<div className="min-h-screen page-gradient" />}>
      <OTPVerifyContent />
    </Suspense>
  );
}
