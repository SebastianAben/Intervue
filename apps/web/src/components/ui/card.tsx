import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-white/70 bg-[rgb(255_255_255_/_0.82)] shadow-[var(--shadow-card)] backdrop-blur',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
