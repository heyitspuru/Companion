import type { LucideIcon } from 'lucide-react';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
};

export function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-xl3 border border-border bg-surface px-8 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-2">
        <Icon className="h-8 w-8 text-primary" aria-hidden />
      </div>
      <h3 className="font-heading text-xl text-headline">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-paragraph">{description}</p>}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
