import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-[var(--primary-600)] text-white hover:bg-[var(--primary)]',
  secondary:
    'border-transparent bg-[var(--primary-muted)] text-[var(--primary)] hover:bg-[#acd5cc]',
  outline:
    'border-[var(--input-border)] bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]',
  ghost:
    'border-transparent bg-transparent text-[var(--foreground)] hover:bg-[var(--surface-muted)]',
  danger: 'border-transparent bg-[var(--danger)] text-white hover:bg-[#8f1414]',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
  icon: 'h-10 w-10 px-0',
};

type SharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  children: ReactNode;
  className?: string;
};

export type ButtonProps = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: string;
  };

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const classes = cn(
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-sm)] border font-semibold tracking-normal transition-colors disabled:pointer-events-none disabled:opacity-55',
    variants[variant],
    sizes[size],
    className,
  );

  const content = (
    <>
      {isLoading ? (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      <span>{children}</span>
    </>
  );

  if (props.href) {
    return (
      <Link className={classes} href={props.href}>
        {content}
      </Link>
    );
  }

  return (
    <button className={classes} disabled={isLoading || props.disabled} {...props}>
      {content}
    </button>
  );
}
