'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Shield, CheckCircle, FileText } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      const userObj = JSON.parse(user);
      if (userObj.role === 'student') {
        router.push('/student/dashboard');
      } else if (userObj.role === 'faculty') {
        router.push('/faculty/dashboard');
      } else if (userObj.role === 'admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen page-gradient flex flex-col">
      {/* Navigation */}
      <nav className="card-elevated border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg logo-gradient flex items-center justify-center">
            <Lock className="text-blue-900" size={20} strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-bold portal-name-gradient">EduSecure Vault</h1>
        </div>
        <div className="flex gap-4">
          <Link
            href="/auth/login"
            className="px-4 py-2 text-foreground hover:bg-card rounded-lg transition"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="px-4 py-2 bg-primary text-white rounded-lg transition font-medium cursor-pointer"
          >
            Register
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-2xl text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="text-accent" size={40} />
            </div>
          </div>

          <h1 className="text-5xl font-bold text-foreground mb-4 text-balance portal-name-gradient">
            Secure Student Document Verification Portal
          </h1>

          <p className="text-xl text-muted-foreground mb-8 text-pretty">
            A comprehensive system for secure document verification with end-to-end encryption,
            multi-factor authentication, and complete audit trails. Demonstrating industry-standard
            cybersecurity practices.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/login"
              className="px-8 py-3 bg-primary text-white rounded-lg transition font-semibold cursor-pointer"
            >
              Sign In
            </Link>
            <Link
              href="/auth/register"
              className="px-8 py-3 bg-card border border-border text-foreground rounded-lg transition font-semibold cursor-pointer"
            >
              Create Account
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="card-elevated p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Lock className="text-blue-400" size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground mb-2">Encryption</h3>
                <p className="text-sm text-muted-foreground">
                  AES-256 document encryption with RSA key exchange ensures documents remain confidential.
                </p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="text-green-400" size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground mb-2">Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Bcryptjs password hashing and OTP-based multi-factor authentication provide strong security.
                </p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="text-purple-400" size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground mb-2">Integrity</h3>
                <p className="text-sm text-muted-foreground">
                  SHA-256 hashing and RSA digital signatures verify document authenticity and detect tampering.
                </p>
              </div>
            </div>
          </div>

          <div className="card-elevated p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="text-orange-400" size={24} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-foreground mb-2">Audit Trail</h3>
                <p className="text-sm text-muted-foreground">
                  Complete activity logs track all uploads, downloads, and verifications for accountability.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security Info */}
        <div className="max-w-4xl w-full card-elevated p-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Security Implementation</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-accent mb-4">Authentication & Authorization</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent">→</span>
                  <span>Password-based login with bcryptjs hashing (10-salt rounds)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">→</span>
                  <span>6-digit OTP valid for 2 minutes as second factor</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">→</span>
                  <span>JWT-based session management for authenticated users</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">→</span>
                  <span>Role-based access control at backend level</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-accent mb-4">Encryption & Signatures</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent">→</span>
                  <span>RSA 2048-bit key pairs for asymmetric encryption</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">→</span>
                  <span>Secure document handling architecture designed for symmetric encryption</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">→</span>
                  <span>Cryptographic hashing techniques incorporated for integrity verification</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">→</span>
                  <span>RSA-based digital signature framework supporting non-repudiation</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-200">
              This system demonstrates core cybersecurity concepts including confidentiality, integrity,
              authentication, authorization, and non-repudiation as required for academic laboratory evaluation.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="card-elevated border-t border-border px-6 py-4 text-center text-sm text-muted-foreground">
        <p>EduSecure Vault © 2026</p>
      </footer>
    </div>
  );
}
