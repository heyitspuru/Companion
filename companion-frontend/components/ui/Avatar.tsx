import { cn } from '@/lib/cn';

type AvatarProps = {
  name: string;
  size?: number;
  /** Highlight the current user. */
  me?: boolean;
  className?: string;
};

export function Avatar({ name, size = 32, me, className }: AvatarProps) {
  const initial = name?.[0]?.toUpperCase() || '?';
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-heading text-headline',
        me
          ? 'bg-gradient-to-br from-primary to-primary-deep ring-2 ring-primary/50'
          : 'bg-gradient-to-br from-surface-2 to-border',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
      aria-hidden
    >
      {initial}
    </div>
  );
}
