'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';
import { API_BASE } from '@/lib/api';
import { AuthShell } from '@/components/layout/AuthShell';
import { LinkButton } from '@/components/ui/Button';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  // Result is only ever set from async callbacks below; the missing-token case
  // is derived during render so we never call setState synchronously in the
  // effect (which the lint rule flags as a cascading-render risk).
  const [result, setResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  const status: 'loading' | 'success' | 'error' = token ? result?.status ?? 'loading' : 'error';
  const message = token ? result?.message ?? '' : 'Invalid verification link.';

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (res.ok) {
          setResult({ status: 'success', message: 'Email verified! Redirecting you to login…' });
          setTimeout(() => router.push('/login'), 3000);
        } else {
          setResult({
            status: 'error',
            message: 'Link expired or already used. Please request a new one.',
          });
        }
      })
      .catch(() => {
        setResult({ status: 'error', message: 'Something went wrong. Please try again.' });
      });
  }, [token, router]);

  return (
    <AuthShell title="Email verification">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary"
            role="status"
            aria-label="Verifying"
          />
          <p className="text-sm text-paragraph">Verifying your email…</p>
        </div>
      )}

      {status === 'success' && (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 shadow-glow-success">
            <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
          </div>
          <p className="font-heading text-base text-success">{message}</p>
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/15">
            <XCircle className="h-8 w-8 text-danger" aria-hidden />
          </div>
          <p className="text-sm text-paragraph">{message}</p>
          <LinkButton href="/login" variant="secondary" fullWidth>
            Back to login
          </LinkButton>
        </div>
      )}
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Email verification">
          <p className="text-center text-sm text-paragraph">Verifying your email…</p>
        </AuthShell>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
