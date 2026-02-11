'use client';

import React from "react"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { UserPlus, Mail } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.fullName || !formData.email || !formData.username || !formData.password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      const response = await axios.post('/api/auth/register', {
        fullName: formData.fullName,
        email: formData.email,
        username: formData.username,
        password: formData.password,
        role: formData.role,
      });

      // Redirect to login
      router.push('/auth/login?registered=true');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
      console.error('[v0] Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen page-gradient flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
              <UserPlus className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-muted-foreground">Join the Secure Document Verification System</p>
        </div>

        {/* Registration Card */}
        <div className="card-elevated p-8 mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-6">Registration Details</h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-muted-foreground" size={18} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="w-full pl-10 pr-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Role
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-input border border-border text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2 rounded-lg font-semibold disabled:opacity-50 mt-6 transition cursor-pointer"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <div className="text-center mb-8">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-accent hover:underline font-semibold">
              Sign In
            </Link>
          </p>
        </div>

        {/* Security Policies */}
        <div className="card-elevated p-6">
          <h3 className="text-lg font-semibold text-accent mb-4">Security Policies & Information</h3>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <h4 className="font-semibold text-foreground mb-2">Password Security</h4>
              <p>
                Passwords are hashed using industry-standard bcryptjs algorithm with 10-salt rounds.
                Plaintext passwords are never stored in our system. This ensures that even if our
                database is compromised, passwords remain secure.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Data Encryption</h4>
              <p>
                All uploaded documents are encrypted using AES-256 encryption. Encryption keys are
                protected using RSA 2048-bit public-key cryptography. This ensures confidentiality
                and prevents unauthorized access.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Multi-Factor Authentication</h4>
              <p>
                After password verification, you must complete OTP-based MFA. OTP codes are valid
                for 2 minutes and can only be used once, providing an additional security layer
                against unauthorized account access.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Document Integrity</h4>
              <p>
                Each document is protected with SHA-256 hashing and RSA digital signatures. These
                mechanisms ensure that documents cannot be tampered with without detection. Faculty
                can verify document authenticity during the verification process.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Access Control</h4>
              <p>
                Role-based access control ensures students can only access their own documents,
                faculty can only verify assigned documents, and admins have full system access.
                All access is logged for audit purposes.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-2">Activity Monitoring</h4>
              <p>
                All system activities including logins, uploads, downloads, and verifications are
                logged with timestamps. Administrators can monitor these logs to detect suspicious
                activities and maintain system security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
