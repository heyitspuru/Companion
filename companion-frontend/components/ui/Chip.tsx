import { cn } from '@/lib/cn';

type ChipProps = {
  children: React.ReactNode;
  /** Arbitrary accent color (e.g. category color). Falls back to primary. */
  color?: string;
  className?: string;
};

/**
 * Pill/tag. When `color` is given we tint bg/border/text from it so categories
 * keep their per-category hue; otherwise it uses the primary brand tint.
 */
export function Chip({ children, color, className }: ChipProps) {
  if (color) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
          className,
        )}
        style={{ color, backgroundColor: `${color}1f`, borderColor: `${color}55` }}
      >
        {children}
      </span>
    );
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary-bright',
        className,
      )}
    >
      {children}
    </span>
  );
}
