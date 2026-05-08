import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  helperText?: string;
};

export function Textarea({ label, error, helperText, id, className, ...props }: TextareaProps) {
  const textareaId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  const descriptionId = `${textareaId}-description`;

  return (
    <label className="block text-sm font-semibold text-[var(--foreground)]" htmlFor={textareaId}>
      {label}
      <textarea
        aria-describedby={helperText || error ? descriptionId : undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          'mt-2 min-h-28 w-full resize-y rounded-[var(--radius-sm)] border border-[var(--input-border)] bg-white px-3 py-3 text-sm font-medium text-[var(--foreground)] shadow-sm transition-colors placeholder:text-[var(--muted-2)] focus:border-[var(--primary-600)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted-2)]',
          error && 'border-[var(--danger)]',
          className,
        )}
        id={textareaId}
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
