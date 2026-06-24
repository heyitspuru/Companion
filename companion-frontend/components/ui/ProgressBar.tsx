import { cn } from '@/lib/cn';

type ProgressBarProps = {
  value: number; // 0-100
  /** Tailwind height class, e.g. 'h-1.5'. */
  heightClass?: string;
  /** Override the fill gradient (Tailwind classes). */
  fillClass?: string;
  className?: string;
};

export function ProgressBar({
  value,
  heightClass = 'h-1.5',
  fillClass = 'bg-gradient-to-r from-primary to-fire',
  className,
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-surface-2', heightClass, className)}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-500 ease-out', fillClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
