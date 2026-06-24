import Link from 'next/link';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/cn';

type WordmarkProps = {
  href?: string;
  /** Show a back-chevron prefix (used inside app navbars). */
  back?: boolean;
  className?: string;
};

/**
 * The Companion wordmark — Black Ops One, the brand's one stencil moment.
 * Renders as a Link when href is provided, otherwise a plain span (landing/hero).
 */
export function Wordmark({ href, back, className }: WordmarkProps) {
  const content = (
    <span className={cn('inline-flex items-center gap-2 font-display text-xl text-ink', className)}>
      <Flame className="h-5 w-5 text-fire" aria-hidden />
      {back && <span className="text-muted">‹</span>}
      COMPANION
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="focus-ring rounded-md">
        {content}
      </Link>
    );
  }
  return content;
}
