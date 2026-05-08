import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type SelectOption = {
  value: string;
  label: string;
};

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
};

export function Select({
  label,
  options,
  error,
  helperText,
  id,
  className,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, '-');
  const descriptionId = `${selectId}-description`;

  return (
    <label className="block text-sm font-semibold text-[var(--foreground)]" htmlFor={selectId}>
      {label}
      <select
        aria-describedby={helperText || error ? descriptionId : undefined}
        aria-invalid={error ? true : undefined}
        className={cn(
          'mt-2 h-[46px] w-full rounded-[var(--radius-sm)] border border-[var(--input-border)] bg-white px-3 text-sm font-medium text-[var(--foreground)] shadow-sm transition-colors focus:border-[var(--primary-600)] disabled:cursor-not-allowed disabled:bg-[var(--surface-muted)] disabled:text-[var(--muted-2)]',
          error && 'border-[var(--danger)]',
          className,
        )}
        id={selectId}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
