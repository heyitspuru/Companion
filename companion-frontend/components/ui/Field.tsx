import { cn } from '@/lib/cn';

const inputBase =
  'w-full rounded-xl bg-surface-2 border border-border px-4 py-3 text-headline ' +
  'placeholder:text-muted text-sm transition-colors duration-200 ' +
  'focus-ring focus-visible:border-primary disabled:opacity-50';

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: boolean;
};

export function Field({ label, hint, error, className, id, ...props }: FieldProps) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label htmlFor={inputId} className="text-xs uppercase tracking-wide text-muted">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(inputBase, error && 'border-danger focus-visible:border-danger', className)}
        {...props}
      />
      {hint && <span className={cn('text-xs', error ? 'text-danger' : 'text-muted')}>{hint}</span>}
    </div>
  );
}

/** Bare input sharing the same styling, for inline/custom layouts. */
export const inputClasses = inputBase;
