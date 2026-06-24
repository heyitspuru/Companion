'use client';

import { useEffect } from 'react';
import { cn } from '@/lib/cn';

type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Disable closing (e.g. mandatory conclusion flow). */
  dismissible?: boolean;
  maxWidthClass?: string;
  children: React.ReactNode;
};

export function Modal({
  open,
  onClose,
  dismissible = true,
  maxWidthClass = 'max-w-lg',
  children,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-6 backdrop-blur-sm"
      onClick={() => dismissible && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'w-full animate-fade-in rounded-xl3 border border-border bg-surface p-8',
          maxWidthClass,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
