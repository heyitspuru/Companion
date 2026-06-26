'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { loginUser } from '@/lib/api';
import { AuthShell } from '@/components/layout/AuthShell';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

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
      const res = await loginUser({ email: form.email.trim(), password: form.password });
      // The JWT itself now lives in an httpOnly cookie set by the backend — we
      // never store it in JS. We keep only non-sensitive identity in
      // localStorage as a client-side "logged in" hint for routing/display.
      localStorage.setItem('username', res.data.username);
      localStorage.setItem('email', res.data.email);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed — check your credentials';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in and keep the streak alive."
      back={{ href: '/', label: 'Back' }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}

        <Field
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@example.com"
          required
        />
        <Field
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="••••••••"
          required
        />

        <Button type="submit" fullWidth loading={loading} loadingText="Logging in…" className="mt-1">
          Log in <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>

        <Link
          href="/forgot-password"
          className="focus-ring rounded-md text-center text-sm font-medium text-primary-bright hover:underline"
        >
          Forgot password?
        </Link>
      </form>

      <p className="mt-6 text-center text-sm text-paragraph">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-primary-bright hover:underline">
          Register
        </Link>
      </p>
    </AuthShell>
  );
}
