'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MailCheck } from 'lucide-react';
import { registerUser } from '@/lib/api';
import { AuthShell } from '@/components/layout/AuthShell';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await registerUser({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      setRegistered(true);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed — please try again';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <AuthShell title="Check your email" subtitle="One step left before you're in.">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 shadow-glow-success">
            <MailCheck className="h-8 w-8 text-success" aria-hidden />
          </div>
          <div>
            <p className="text-sm text-paragraph">We sent a verification link to</p>
            <p className="mt-1 font-heading text-base text-primary-bright">{form.email}</p>
          </div>
          <p className="text-xs text-muted">
            Click the link to activate your account. It expires in 24 hours. Don&apos;t see it? Check
            your spam folder.
          </p>
          <Link
            href="/login"
            className="focus-ring mt-2 rounded-md text-sm font-medium text-primary-bright hover:underline"
          >
            Back to login
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Join the grind"
      subtitle="Create your account and find your circle."
      back={{ href: '/', label: 'Back' }}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}

        <Field
          label="Username"
          name="username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="thegrinder"
          required
        />
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
          placeholder="Min. 8 characters"
          required
        />

        <Button type="submit" fullWidth loading={loading} loadingText="Creating…" className="mt-1">
          Create account <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-paragraph">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-primary-bright hover:underline">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
