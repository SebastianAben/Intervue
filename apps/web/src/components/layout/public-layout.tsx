import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export type PublicLayoutProps = {
  children: ReactNode;
  ctaSlot?: ReactNode;
};

export function PublicLayout({ children, ctaSlot }: PublicLayoutProps) {
  return (
    <main className="min-h-screen bg-[var(--background)]">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
        <a className="text-xl font-extrabold text-[var(--primary)]" href="/">
          Intervue
        </a>
        <nav aria-label="Navigasi publik" className="flex items-center gap-2 sm:gap-3">
          <Button href="/login" size="sm" variant="ghost">
            Masuk
          </Button>
          {ctaSlot ?? (
            <Button href="/register" size="sm">
              Mulai Latihan
            </Button>
          )}
        </nav>
      </header>
      {children}
    </main>
  );
}
