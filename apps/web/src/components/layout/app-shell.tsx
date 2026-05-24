'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { ReactNode } from 'react';
import type { AuthUser } from '@intervue/shared';
import { LogoutButton } from '@/components/auth/logout-button';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useCurrentUser } from '@/lib/use-current-user';

export type AppNavItem = {
  label: string;
  href: string;
  marker: string;
  icon?: SidebarIconName;
};

const navItems: AppNavItem[] = [
  { label: 'Dashboard', href: '/dashboard', marker: 'D', icon: 'dashboard' },
  { label: 'Target Lamaran', href: '/targets', marker: 'T', icon: 'briefcase' },
  { label: 'Interview', href: '/interview', marker: 'I' },
  { label: 'Riwayat Sesi', href: '/history', marker: 'H', icon: 'history' },
  { label: 'Analitik', href: '/reports', marker: 'R', icon: 'analytics' },
  { label: 'Pengaturan', href: '/settings', marker: 'S', icon: 'settings' },
];

type SidebarIconName =
  | 'analytics'
  | 'briefcase'
  | 'dashboard'
  | 'help'
  | 'history'
  | 'logout'
  | 'settings';

const desktopNavItems = navItems.filter((item) => item.href !== '/interview');

export type AppShellProps = {
  activeHref: string;
  title: string;
  description?: string;
  user?: AuthUser | null;
  mainClassName?: string;
  showPageHeader?: boolean;
  children: ReactNode;
};

export function AppShell({
  activeHref,
  title,
  description,
  user,
  mainClassName,
  showPageHeader = true,
  children,
}: AppShellProps) {
  const auth = useCurrentUser(user ?? null);
  const shellUser = user ?? auth.user;
  const displayName = shellUser?.name ?? (auth.isLoading ? 'Memuat akun...' : 'Pengguna');

  return (
    <div className="min-h-[100dvh] bg-[var(--background)] lg:grid lg:h-[100dvh] lg:grid-cols-[280px_minmax(0,1fr)] lg:overflow-hidden">
      <aside className="hidden min-h-[100dvh] flex-col border-r border-white/80 bg-white/72 p-4 shadow-[0_20px_70px_rgb(18_60_55_/_0.08)] backdrop-blur lg:flex lg:h-[100dvh] lg:min-h-0">
        <div className="w-full pb-6 pt-[7px]">
          <Link
            className="flex w-fit items-center rounded-[var(--radius-sm)] px-4 py-3 transition-colors hover:bg-[rgb(18_60_55_/_0.06)]"
            href="/"
          >
            <Image
              alt="Intervue"
              className="h-16 w-auto object-contain"
              height={132}
              priority
              src="/brand/logo-tulisan-display.png"
              width={250}
            />
          </Link>
        </div>

        <div className="mb-6 flex h-[64px] w-full items-center rounded-[var(--radius-md)] border border-white/80 bg-[var(--surface-muted)] p-[9px]">
          <div className="mr-3 grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-white font-[var(--font-jakarta)] text-sm font-black text-[var(--primary)] shadow-[0_8px_20px_rgb(18_60_55_/_0.08)]">
            {shellUser ? getInitials(shellUser.name) : '...'}
          </div>
          <div className="min-w-0 overflow-hidden">
            <p className="truncate text-sm font-semibold leading-5 text-[var(--foreground)]">
              {displayName}
            </p>
            <p className="truncate text-xs font-semibold leading-3 text-[var(--muted)]">
              Persiapan interview
            </p>
          </div>
        </div>

        <nav aria-label="Navigasi aplikasi" className="flex flex-1 flex-col gap-1">
          {desktopNavItems.map((item) => (
            <Link
              className={cn(
                'flex h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm font-semibold leading-5 transition-all duration-300 active:translate-y-px',
                activeHref === item.href
                  ? 'bg-[var(--primary)] text-white shadow-[0_12px_24px_rgb(18_60_55_/_0.14)]'
                  : 'text-[var(--muted)] hover:bg-[rgb(18_60_55_/_0.07)] hover:text-[var(--foreground)]',
              )}
              href={item.href}
              key={item.href}
            >
              {item.icon ? <SidebarIcon name={item.icon} /> : null}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="w-full pt-2">
          <div className="flex w-full flex-col gap-4 border-t border-[#e5e5e5] pt-[17px]">
            <Link
              className="flex h-[46px] w-full items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] text-base font-semibold leading-[25.6px] text-white shadow-[0_14px_30px_rgb(18_60_55_/_0.18)] transition-all duration-300 hover:bg-[var(--primary-600)] active:translate-y-px"
              href="/interview"
            >
              Latih Interview Baru
            </Link>

            <div className="flex w-full flex-col gap-1">
              <Link
                className="flex h-10 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm font-semibold leading-5 text-[var(--muted)] transition-colors hover:bg-[rgb(18_60_55_/_0.07)]"
                href="/settings"
              >
                <SidebarIcon name="help" />
                Bantuan
              </Link>
              <div className="flex h-10 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm font-semibold leading-5 text-[var(--muted)] transition-colors hover:bg-[rgb(18_60_55_/_0.07)]">
                <SidebarIcon name="logout" />
                <LogoutButton
                  className="m-0 h-5 cursor-pointer border-0 bg-transparent p-0 text-left text-sm font-normal leading-5 text-inherit disabled:cursor-default disabled:opacity-55"
                  unstyled
                />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 pb-20 lg:h-screen lg:overflow-y-auto lg:pb-0">
        <header className="sticky top-0 z-20 border-b border-white/80 bg-[rgb(245_247_244_/_0.9)] px-5 py-4 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <Link className="flex items-center" href="/">
              <Image
                alt="Intervue"
                className="h-14 w-auto object-contain"
                height={132}
                priority
                src="/brand/logo-tulisan-display.png"
                width={250}
              />
            </Link>
            <Button href="/interview" size="sm">
              Latihan
            </Button>
            <LogoutButton size="sm" />
          </div>
        </header>

        <main className={cn('mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:py-10', mainClassName)}>
          {showPageHeader ? (
            <header className="mb-8">
              <h1 className="font-[var(--font-jakarta)] text-4xl font-black leading-none tracking-[-0.035em] text-[var(--foreground)] sm:text-5xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                  {description}
                </p>
              ) : null}
            </header>
          ) : null}
          {children}
        </main>
      </div>

      <nav
        aria-label="Navigasi aplikasi mobile"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-white/80 bg-white/90 shadow-[0_-12px_34px_rgb(18_60_55_/_0.08)] backdrop-blur lg:hidden"
      >
        {navItems.map((item) => (
          <Link
            className={cn(
              'flex h-16 flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors',
              activeHref === item.href ? 'text-[var(--primary-600)]' : 'text-[var(--muted)]',
            )}
            href={item.href}
            key={item.href}
          >
            <span
              aria-hidden="true"
              className={cn(
                'grid h-6 w-6 place-items-center rounded-full text-[10px]',
                activeHref === item.href ? 'bg-[#dceee7]' : 'bg-[var(--surface-muted)]',
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

function getInitials(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'U'
  );
}

function SidebarIcon({ name }: { name: SidebarIconName }) {
  const iconClass = 'h-4 w-4 shrink-0';
  const commonProps = {
    'aria-hidden': true,
    className: iconClass,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.9,
    viewBox: '0 0 24 24',
  };

  switch (name) {
    case 'analytics':
      return (
        <svg {...commonProps}>
          <path d="M4 19V5h16v14H4Z" />
          <path d="M8 16v-4" />
          <path d="M12 16V8" />
          <path d="M16 16v-6" />
        </svg>
      );
    case 'briefcase':
      return (
        <svg {...commonProps}>
          <path d="M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7" />
          <path d="M5 7h14v12H5V7Z" />
          <path d="M9 12h6" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg {...commonProps}>
          <path d="M4 4h6v6H4V4Z" />
          <path d="M14 4h6v6h-6V4Z" />
          <path d="M4 14h6v6H4v-6Z" />
          <path d="M14 14h6v6h-6v-6Z" />
        </svg>
      );
    case 'help':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.8 9.4a2.4 2.4 0 1 1 3.4 2.2c-.8.4-1.2.9-1.2 1.7" />
          <path d="M12 17h.01" />
        </svg>
      );
    case 'history':
      return (
        <svg {...commonProps}>
          <path d="M4 12a8 8 0 1 0 2.3-5.7" />
          <path d="M4 5.5v4h4" />
          <path d="M12 8v5l3 2" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...commonProps}>
          <path d="M14 8V6a2 2 0 0 0-2-2H5v16h7a2 2 0 0 0 2-2v-2" />
          <path d="M10 12h10" />
          <path d="m17 9 3 3-3 3" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...commonProps}>
          <path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z" />
          <path d="m19.4 15 .7 1.4-2 2-1.4-.7a7.6 7.6 0 0 1-1.7.7L14.5 20h-5l-.5-1.6a7.6 7.6 0 0 1-1.7-.7l-1.4.7-2-2 .7-1.4a7.6 7.6 0 0 1-.7-1.7L2.3 12l1.6-1.3c.2-.6.4-1.2.7-1.7l-.7-1.4 2-2 1.4.7c.5-.3 1.1-.5 1.7-.7L9.5 4h5l.5 1.6c.6.2 1.2.4 1.7.7l1.4-.7 2 2-.7 1.4c.3.5.5 1.1.7 1.7l1.6 1.3-1.6 1.3c-.2.6-.4 1.2-.7 1.7Z" />
        </svg>
      );
  }
}
