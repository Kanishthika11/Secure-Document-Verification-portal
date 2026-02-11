'use client';

import React from "react"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { Lock, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password,
      });

      // Store user data in session storage
      sessionStorage.setItem('userId', response.data.userId);
      sessionStorage.setItem('email', response.data.email);
      sessionStorage.setItem('role', response.data.role);

      // Redirect to OTP verification
      router.push(`/auth/verify-otp?userId=${response.data.userId}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
      console.error('[v0] Login error:', err);
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
            <div className="w-16 h-16 rounded-full logo-gradient flex items-center justify-center">
              <Lock className="text-blue-900" size={32} strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-3xl font-bold portal-name-gradient mb-2">EduSecure Vault</h1>
          <p className="text-muted-foreground">Document Verification System</p>
        </div>

        {/* Login Card */}
        <div className="card-elevated p-8 mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Sign In</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 text-muted-foreground" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-muted-foreground" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded-lg font-semibold disabled:opacity-50 mt-6 transition cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Signup Link */}
        <div className="text-center">
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-accent hover:underline font-semibold">
              Sign Up
            </Link>
          </p>
        </div>

        {/* Security Info */}
        <div className="mt-8 bg-card/50 border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-accent mb-2">Security Information</h3>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Password-based authentication with bcrypt hashing</li>
            <li>• Multi-factor authentication via OTP</li>
            <li>• JWT-based session management</li>
            <li>• RSA 2048-bit encryption for document security</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
