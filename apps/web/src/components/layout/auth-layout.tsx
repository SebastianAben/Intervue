import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';

export type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <main className="grid min-h-[100dvh] bg-[var(--background)] lg:grid-cols-[minmax(0,0.92fr)_minmax(520px,1fr)]">
      <section className="relative hidden overflow-hidden bg-[var(--primary)] p-10 text-white lg:flex lg:flex-col lg:justify-center">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/intervue-auth/1400/1200')] bg-cover bg-center opacity-20 grayscale contrast-125" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_18%,rgb(201_214_107_/_0.35),transparent_28rem),linear-gradient(135deg,rgb(18_60_55_/_0.82),rgb(18_60_55_/_0.96))]" />
        <div className="relative max-w-xl">
          <p className="text-sm font-semibold text-[var(--primary-muted)]">
            Latihan interview berbasis suara
          </p>
          <blockquote className="mt-6 font-[var(--font-jakarta)] text-5xl font-black leading-[0.98] tracking-[-0.04em]">
            Jawaban yang siap terdengar berbeda saat diucapkan.
          </blockquote>
          <p className="mt-6 max-w-md text-sm leading-6 text-[#d7ece8]">
            Simpan target lamaran, latih jawaban lewat suara, dan baca feedback yang langsung bisa
            dipakai.
          </p>
        </div>
        <div className="relative mt-28 grid grid-cols-3 gap-3">
          {['Target', 'Voice', 'Report'].map((item) => (
            <div
              className="rounded-[var(--radius-md)] border border-white/10 bg-white/8 p-4 text-sm font-semibold text-white/78 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.12)]"
              key={item}
            >
              {item}
            </div>
          ))}
        </div>
      </section>
      <section className="flex min-h-[100dvh] items-center justify-center bg-[var(--background)] px-5 py-10">
        <div className="w-full max-w-[440px]">
          <a
            className="mb-10 inline-flex items-center lg:hidden"
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
          </a>
          <Card className="border-transparent bg-transparent p-0 shadow-none">
            <Link
              className="mb-6 inline-flex h-9 items-center rounded-[var(--radius-sm)] px-3 text-sm font-bold text-[var(--primary-600)] transition-colors hover:bg-[rgb(18_60_55_/_0.07)] active:translate-y-px"
              href="/"
            >
              &lt;- Kembali ke beranda
            </Link>
            <h1 className="font-[var(--font-jakarta)] text-4xl font-black leading-none tracking-[-0.035em] text-[var(--foreground)]">
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
