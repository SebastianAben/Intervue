import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="min-h-screen px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <Link className="font-semibold text-[#0e5f55]" href="/">
          Intervue
        </Link>
        <section className="mt-12 rounded-lg border border-[#d8ded8] bg-white p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[#0e5f55]">
            Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Buat target lamaran pertama</h1>
          <p className="mt-3 max-w-2xl text-[#52615c]">
            App shell, target list, dan progress summary akan dibangun setelah fondasi Phase 0
            stabil.
          </p>
        </section>
      </div>
    </main>
  );
}
