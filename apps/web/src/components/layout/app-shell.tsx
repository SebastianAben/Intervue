import Link from 'next/link';
import type { ReactNode } from 'react';
import type { AuthUser } from '@intervue/shared';
import { LogoutButton } from '@/components/auth/logout-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export type AppNavItem = {
  label: string;
  href: string;
  marker: string;
};

const navItems: AppNavItem[] = [
  { label: 'Dashboard', href: '/dashboard', marker: 'D' },
  { label: 'Target Lamaran', href: '/targets', marker: 'T' },
  { label: 'Interview', href: '/interview', marker: 'I' },
  { label: 'History', href: '/history', marker: 'H' },
  { label: 'Report', href: '/reports', marker: 'R' },
  { label: 'Settings', href: '/settings', marker: 'S' },
];

export type AppShellProps = {
  activeHref: string;
  title: string;
  description?: string;
  user: AuthUser;
  children: ReactNode;
};

export function AppShell({ activeHref, title, description, user, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--background)] lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen flex-col bg-white px-4 py-6 shadow-[var(--shadow-shell)] lg:flex">
        <Link className="px-3 text-2xl font-extrabold text-[var(--primary)]" href="/">
          Intervue
        </Link>
        <Button className="mt-8 w-full" href="/interview">
          Latih Interview Baru
        </Button>
        <nav aria-label="Navigasi aplikasi" className="mt-7 flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <Link
              className={cn(
                'flex h-[42px] items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm font-bold transition-colors',
                activeHref === item.href
                  ? 'bg-[var(--primary-600)] text-[var(--primary-muted)]'
                  : 'text-[var(--muted)] hover:bg-[var(--surface-muted)]',
              )}
              href={item.href}
              key={item.href}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'grid h-7 w-7 place-items-center rounded-full text-xs',
                  activeHref === item.href
                    ? 'bg-white/10 text-white'
                    : 'bg-[var(--surface-muted)] text-[var(--primary)]',
                )}
              >
                {item.marker}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-4">
          <p className="text-sm font-bold text-[var(--foreground)]">Butuh arahan?</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
            Mulai dari target lamaran agar simulasi interview relevan.
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--foreground)]">{user.name}</p>
            <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="min-w-0 pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[rgb(248_250_249_/_0.92)] px-5 py-4 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Link className="text-xl font-extrabold text-[var(--primary)]" href="/">
              Intervue
            </Link>
            <Button href="/interview" size="sm">
              Latihan
            </Button>
            <LogoutButton size="sm" />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-10">
          <header className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.08em] text-[var(--primary-600)]">
              Workspace
            </p>
            <h1 className="mt-2 font-[var(--font-jakarta)] text-3xl font-extrabold text-[var(--foreground)] sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>
            ) : null}
          </header>
          {children}
        </main>
      </div>

      <nav
        aria-label="Navigasi aplikasi mobile"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-[var(--border)] bg-white lg:hidden"
      >
        {navItems.map((item) => (
          <Link
            className={cn(
              'flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold',
              activeHref === item.href ? 'text-[var(--primary-600)]' : 'text-[var(--muted)]',
            )}
            href={item.href}
            key={item.href}
          >
            <span
              aria-hidden="true"
              className={cn(
                'grid h-6 w-6 place-items-center rounded-full text-[10px]',
                activeHref === item.href ? 'bg-[#d7ece8]' : 'bg-[var(--surface-muted)]',
              )}
            >
              {item.marker}
            </span>
            <span className="max-w-full truncate px-1">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
