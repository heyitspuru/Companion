'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { resetPassword } from '@/lib/api';
import { AuthShell } from '@/components/layout/AuthShell';
import { Field } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { PageLoader } from '@/components/ui/Skeleton';

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

  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;

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
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Reset failed — the link may have expired';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Set new password"
      subtitle="Choose something strong."
      back={{ href: '/login', label: 'Back to login' }}
    >
      {done ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 shadow-glow-success">
            <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
          </div>
          <p className="font-heading text-base text-success">Password updated!</p>
          <p className="text-sm text-paragraph">Redirecting you to login…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && <ErrorBanner message={error} />}
          <Field
            label="New password"
            name="newPassword"
            type="password"
            suppressHydrationWarning
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 8 characters"
            required
            disabled={!token}
          />
          <Field
            label="Confirm password"
            name="confirmPassword"
            type="password"
            suppressHydrationWarning
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            disabled={!token}
            error={mismatch}
            hint={mismatch ? "Passwords don't match" : undefined}
          />
          <Button
            type="submit"
            fullWidth
            loading={loading}
            loadingText="Updating…"
            disabled={!token}
            className="mt-1"
          >
            Update password <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
