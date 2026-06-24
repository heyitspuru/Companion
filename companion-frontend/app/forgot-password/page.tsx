'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, MailCheck } from 'lucide-react';
import { forgotPassword } from '@/lib/api';
import { AuthShell } from '@/components/layout/AuthShell';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';

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
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Something went wrong — please try again';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      back={{ href: '/login', label: 'Back to login' }}
    >
      {sent ? (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 shadow-glow-success">
            <MailCheck className="h-8 w-8 text-success" aria-hidden />
          </div>
          <div>
            <p className="font-heading text-base text-success">Check your inbox</p>
            <p className="mt-1 text-sm text-paragraph">
              If an account exists for{' '}
              <span className="font-medium text-headline">{email}</span>, a reset link is on its way.
            </p>
          </div>
          <Link
            href="/login"
            className="focus-ring rounded-md text-sm font-medium text-primary-bright hover:underline"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <ErrorBanner message={error} />}
          <Field
            label="Email address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <Button type="submit" fullWidth loading={loading} loadingText="Sending…" className="mt-1">
            Send reset link <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
