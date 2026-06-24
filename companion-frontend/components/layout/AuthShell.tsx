import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type AuthShellProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  back?: { href: string; label: string };
  children: React.ReactNode;
};

/** Centered card layout shared by login / register / forgot / reset / verify. */
export function AuthShell({ title, subtitle, back, children }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <div className="relative w-full max-w-md animate-fade-up rounded-xl3 border border-border bg-surface/80 p-8 shadow-glow backdrop-blur-xl sm:p-10">
        <div className="mb-8">
          {back && (
            <Link
              href={back.href}
              className="focus-ring mb-4 inline-flex items-center gap-1.5 rounded-md text-sm text-muted transition-colors hover:text-paragraph"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {back.label}
            </Link>
          )}
          <h1 className="font-display text-3xl leading-tight text-headline">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-paragraph">{subtitle}</p>}
        </div>
        {children}
      </div>
    </main>
  );
}
