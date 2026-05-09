'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginUser } from '../../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', res.data.username);
      localStorage.setItem('email', res.data.email);
      router.push('/dashboard');
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Login failed — check your credentials';
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
          <Link href="/" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '14px' }}>
            ← Back
          </Link>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'white', marginTop: '16px', marginBottom: '8px' }}>
            Welcome Back 👋
          </h1>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>Login to continue your streak</p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.3)',
            color: '#fb7185', padding: '12px 16px', borderRadius: '12px',
            marginBottom: '24px', fontSize: '14px',
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: '#9ca3af', fontSize: '12px' }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
              style={{
                background: '#0a0a0f', border: '1px solid #1e1e2e',
                borderRadius: '12px', padding: '12px 14px', color: 'white',
                fontSize: '14px', outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: '#9ca3af', fontSize: '12px' }}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
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
            {loading ? 'Logging in...' : 'Login →'}
          </button>

          <Link href="/forgot-password" style={{
            color: '#a5b4fc', fontSize: '13px', fontWeight: '600',
            textAlign: 'center', textDecoration: 'none'
          }}>
            Forgot password?
          </Link>
        </form>

        <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '24px', fontSize: '14px' }}>
          Don&apos;t have an account?{' '}
          <Link href="/register" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: '600' }}>
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}