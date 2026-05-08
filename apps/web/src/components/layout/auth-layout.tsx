import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

export type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="grid min-h-screen bg-[var(--background)] lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1fr)]">
      <section className="relative hidden overflow-hidden bg-[var(--primary)] p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <a className="text-2xl font-extrabold" href="/">
          Intervue
        </a>
        <div className="max-w-xl">
          <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--primary-muted)]">
            Latihan interview berbasis suara
          </p>
          <blockquote className="mt-6 font-[var(--font-jakarta)] text-4xl font-bold leading-tight">
            “Intervue membantu saya latihan menjawab dengan struktur yang lebih jelas sebelum
            interview sesungguhnya.”
          </blockquote>
          <p className="mt-6 text-sm font-semibold text-[#d7ece8]">Nadia, Fresh Graduate</p>
        </div>
        <div className="absolute -right-24 bottom-20 h-64 w-64 rounded-full border border-white/20" />
        <div className="absolute right-24 top-24 h-20 w-20 rounded-full bg-[var(--accent)]/80" />
      </section>
      <section className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 py-10">
        <div className="w-full max-w-[440px]">
          <a
            className="mb-10 inline-block text-xl font-extrabold text-[var(--primary)] lg:hidden"
            href="/"
          >
            Intervue
          </a>
          <Card className="border-transparent bg-transparent p-0 shadow-none">
            <h1 className="font-[var(--font-jakarta)] text-3xl font-extrabold text-[var(--foreground)]">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </Card>
        </div>
      </section>
    </main>
  );
}
