import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  helperText?: string;
};

export function Input({ label, error, helperText, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  const descriptionId = `${inputId}-description`;

  return (
    <label className="block text-sm font-semibold text-[var(--foreground)]" htmlFor={inputId}>
      {label}
      <input
        aria-describedby={helperText || error ? descriptionId : undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          'mt-2 h-[48px] w-full rounded-[var(--radius-sm)] border border-[var(--input-border)] bg-white/82 px-3 text-sm font-medium text-[var(--foreground)] shadow-[0_1px_0_rgb(255_255_255_/_0.72)] transition-colors placeholder:text-[var(--muted-2)] focus:border-[var(--primary-600)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted-2)]',
          error && 'border-[var(--danger)]',
          className,
        )}
        id={inputId}
        {...props}
      />
      {helperText || error ? (
        <span
          className={cn(
            'mt-2 block text-xs font-medium',
            error ? 'text-[var(--danger)]' : 'text-[var(--muted)]',
          )}
          id={descriptionId}
        >
          {error ?? helperText}
        </span>
      ) : null}
    </label>
  );
}
