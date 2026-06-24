import { cn } from '@/lib/cn';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Adds a hover border-glow — use for clickable cards. */
  interactive?: boolean;
  /** Accent border tone. */
  tone?: 'default' | 'success' | 'gold' | 'danger' | 'primary';
};

const tones: Record<NonNullable<CardProps['tone']>, string> = {
  default: 'border-border',
  success: 'border-success/30',
  gold: 'border-gold/30',
  danger: 'border-danger/40',
  primary: 'border-primary/40',
};

export function Card({
  interactive,
  tone = 'default',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl3 border bg-surface p-6 transition-colors duration-200',
        tones[tone],
        interactive && 'cursor-pointer hover:border-primary hover:shadow-glow',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
