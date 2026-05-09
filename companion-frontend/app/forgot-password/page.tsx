'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '../../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Something went wrong — please try again';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh', backgroundColor: '#0a0a0f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', fontFamily: 'system-ui, sans-serif',
    }}>
      <div style={{
        background: '#12121a', border: '1px solid #1e1e2e',
        borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '440px',
      }}>
        <div style={{ marginBottom: '32px' }}>
          <Link href="/login" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
            ← Back to login
          </Link>
          <h1 style={{ fontSize: '30px', fontWeight: '800', color: 'white', marginTop: '16px', marginBottom: '8px' }}>
            Reset your password 🔑
          </h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {sent ? (
          <div style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '16px', padding: '24px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📬</div>
            <p style={{ color: '#10b981', fontWeight: '700', fontSize: '16px', marginBottom: '8px' }}>
              Check your inbox
            </p>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              If an account exists for <strong style={{ color: 'white' }}>{email}</strong>, a reset link is on its way.
            </p>
            <Link href="/login" style={{
              display: 'inline-block', marginTop: '20px',
              color: '#a5b4fc', fontSize: '14px', textDecoration: 'none', fontWeight: '600'
            }}>
              Back to login →
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div style={{
                background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
                color: '#fb7185', padding: '12px 16px', borderRadius: '12px',
                marginBottom: '24px', fontSize: '14px',
              }}>{error}</div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#9ca3af', fontSize: '12px' }}>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    background: '#0a0a0f', border: '1px solid #1e1e2e',
                    borderRadius: '12px', padding: '12px 14px', color: 'white',
                    fontSize: '14px', outline: 'none'
                  }}
                />
              </div>

              <button type="submit" disabled={loading} style={{
                background: loading ? '#374151' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', fontWeight: '700', padding: '14px',
                borderRadius: '12px', border: 'none', fontSize: '15px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 0 20px rgba(99,102,241,0.3)',
              }}>
                {loading ? 'Sending...' : 'Send reset link →'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}