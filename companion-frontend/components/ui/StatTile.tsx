import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

type StatTileProps = {
  icon?: LucideIcon;
  value: React.ReactNode;
  label: string;
  /** Accent color for icon + value (hex). */
  color?: string;
  className?: string;
};

/** Scoreboard stat block — big Russo One number over a muted label. */
export function StatTile({ icon: Icon, value, label, color = '#ff8906', className }: StatTileProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center rounded-xl2 border border-border bg-surface px-4 py-5 text-center',
        className,
      )}
    >
      {Icon && <Icon className="mb-2 h-6 w-6" style={{ color }} aria-hidden />}
      <div className="font-heading text-3xl leading-none" style={{ color }}>
        {value}
      </div>
      <div className="mt-2 text-xs uppercase tracking-wide text-muted">{label}</div>
    </div>
  );
}
