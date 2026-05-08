import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'danger' | 'warning';

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-[var(--surface-muted)] text-[var(--muted)]',
  primary: 'bg-[#d7ece8] text-[var(--primary)]',
  success: 'bg-[#e1f2e4] text-[var(--success)]',
  danger: 'bg-[#fde8e8] text-[var(--danger)]',
  warning: 'bg-[#fff4d8] text-[var(--warning)]',
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  children: ReactNode;
};

export function Badge({ tone = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
