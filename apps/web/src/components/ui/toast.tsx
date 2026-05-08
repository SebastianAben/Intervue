import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type ToastTone = 'neutral' | 'success' | 'danger';

const tones: Record<ToastTone, string> = {
  neutral: 'border-[var(--border)]',
  success: 'border-[var(--success)]',
  danger: 'border-[var(--danger)]',
};

export type ToastProps = {
  title: string;
  description?: ReactNode;
  tone?: ToastTone;
};

export function Toast({ title, description, tone = 'neutral' }: ToastProps) {
  return (
    <div
      aria-live="polite"
      className={cn(
        'rounded-[var(--radius-sm)] border bg-white p-4 shadow-[var(--shadow-card)]',
        tones[tone],
      )}
      role="status"
    >
      <p className="text-sm font-bold text-[var(--foreground)]">{title}</p>
      {description ? <p className="mt-1 text-sm text-[var(--muted)]">{description}</p> : null}
    </div>
  );
}
