import { cn } from '@/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-surface-2', className)} />;
}

/** Full-screen centered loading state used by page-level guards. */
export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary"
        role="status"
        aria-label={label}
      />
      <p className="font-heading text-sm uppercase tracking-widest text-muted">{label}</p>
    </div>
  );
}
