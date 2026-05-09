'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { resetPassword } from '../../lib/api';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) setError('Invalid or missing reset token. Please request a new link.');
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await resetPassword(token, newPassword);
      setDone(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Reset failed — the link may have expired';
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
            Set new password 🔐
          </h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>Choose something strong</p>
        </div>

        {done ? (
          <div style={{
            background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
            borderRadius: '16px', padding: '24px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
            <p style={{ color: '#10b981', fontWeight: '700', fontSize: '16px', marginBottom: '8px' }}>
              Password updated!
            </p>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>
              Redirecting you to login...
            </p>
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
                <label style={{ color: '#9ca3af', fontSize: '12px' }}>New password</label>
                <input
                  type="password"
                  suppressHydrationWarning
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  disabled={!token}
                  style={{
                    background: '#0a0a0f', border: '1px solid #1e1e2e',
                    borderRadius: '12px', padding: '12px 14px', color: 'white',
                    fontSize: '14px', outline: 'none',
                    opacity: !token ? 0.5 : 1
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ color: '#9ca3af', fontSize: '12px' }}>Confirm password</label>
                <input
                  type="password"
                  suppressHydrationWarning
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={!token}
                  style={{
                    background: '#0a0a0f',
                    border: `1px solid ${confirmPassword && confirmPassword !== newPassword ? 'rgba(244,63,94,0.4)' : '#1e1e2e'}`,
                    borderRadius: '12px', padding: '12px 14px', color: 'white',
                    fontSize: '14px', outline: 'none',
                    opacity: !token ? 0.5 : 1
                  }}
                />
                {confirmPassword && confirmPassword !== newPassword && (
                  <span style={{ color: '#fb7185', fontSize: '12px' }}>Passwords don't match</span>
                )}
              </div>

              <button type="submit" disabled={loading || !token} style={{
                background: loading || !token ? '#374151' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', fontWeight: '700', padding: '14px',
                borderRadius: '12px', border: 'none', fontSize: '15px',
                cursor: loading || !token ? 'not-allowed' : 'pointer',
                boxShadow: loading || !token ? 'none' : '0 0 20px rgba(99,102,241,0.3)',
              }}>
                {loading ? 'Updating...' : 'Update password →'}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', backgroundColor: '#0a0a0f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontFamily: 'system-ui'
      }}>Loading...</div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}