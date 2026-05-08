import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Button } from './button';

export type ModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose?: () => void;
};

export function Modal({ open, title, description, children, onClose }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-[rgb(0_53_53_/_0.32)] px-4"
      role="dialog"
    >
      <div className="w-full max-w-lg rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-6 shadow-[var(--shadow-shell)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-[var(--font-jakarta)] text-xl font-bold text-[var(--foreground)]">
              {title}
            </h2>
            {description ? <p className="mt-2 text-sm text-[var(--muted)]">{description}</p> : null}
          </div>
          {onClose ? (
            <Button aria-label="Tutup modal" onClick={onClose} size="icon" variant="ghost">
              x
            </Button>
          ) : null}
        </div>
        <div className={cn('mt-5')}>{children}</div>
      </div>
    </div>
  );
}
