import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export type PublicLayoutProps = {
  children: ReactNode;
  ctaSlot?: ReactNode;
};

export function PublicLayout({ children, ctaSlot }: PublicLayoutProps) {
  return (
    <main className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[var(--background)]">
      <header className="sticky top-0 z-30 mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
        <a
          className="rounded-full bg-white/72 px-4 py-2 text-lg font-extrabold text-[var(--primary)] shadow-[0_10px_30px_rgb(18_60_55_/_0.08)] backdrop-blur transition-transform duration-300 hover:-translate-y-0.5"
          href="/"
        >
          Intervue
        </a>
        <nav
          aria-label="Navigasi publik"
          className="flex items-center gap-2 rounded-full border border-white/80 bg-white/72 p-1 shadow-[0_10px_30px_rgb(18_60_55_/_0.08)] backdrop-blur sm:gap-3"
        >
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
