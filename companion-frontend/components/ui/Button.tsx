import Link from 'next/link';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'fire' | 'gradient';
type Size = 'sm' | 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-xl font-heading uppercase tracking-wide ' +
  'transition-all duration-200 focus-ring disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer';

const variants: Record<Variant, string> = {
  primary:
    'bg-primary text-headline shadow-glow hover:bg-primary-bright hover:shadow-glow',
  gradient:
    'bg-fire-gradient text-headline shadow-glow hover:shadow-glow-fire hover:brightness-110',
  fire: 'bg-fire text-headline shadow-glow-fire hover:brightness-110',
  secondary:
    'bg-transparent text-primary-bright border border-primary/40 hover:border-primary hover:bg-primary/10',
  ghost: 'bg-transparent text-paragraph border border-border hover:border-muted hover:text-headline',
  danger:
    'bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25',
};

const sizes: Record<Size, string> = {
  sm: 'px-3.5 py-2 text-xs',
  md: 'px-5 py-3 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function buttonClasses(
  variant: Variant = 'primary',
  size: Size = 'md',
  fullWidth = false,
  className = '',
) {
  return cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className);
}

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    loading?: boolean;
    loadingText?: string;
  };

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  loading,
  loadingText,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonClasses(variant, size, fullWidth, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? loadingText || 'Working…' : children}
    </button>
  );
}

type LinkButtonProps = CommonProps & {
  href: string;
};

export function LinkButton({
  href,
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  children,
}: LinkButtonProps) {
  return (
    <Link href={href} className={buttonClasses(variant, size, fullWidth, className)}>
      {children}
    </Link>
  );
}
