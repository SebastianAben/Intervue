import type { HealthResponse } from '@intervue/shared';
import Link from 'next/link';

async function getHealth(): Promise<HealthResponse> {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

  try {
    const response = await fetch(`${apiBaseUrl}/health`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return {
        data: null,
        error: {
          code: 'BACKEND_UNAVAILABLE',
          message: `Backend returned ${response.status}`,
        },
      };
    }

    return (await response.json()) as HealthResponse;
  } catch {
    return {
      data: null,
      error: {
        code: 'BACKEND_UNAVAILABLE',
        message: 'Backend is not reachable.',
      },
    };
  }
}

export default async function HomePage() {
  const health = await getHealth();

  return (
    <main className="min-h-screen px-6 py-8">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <Link className="text-xl font-semibold tracking-normal text-[#0e5f55]" href="/">
          Intervue
        </Link>
        <div className="flex items-center gap-3 text-sm font-medium">
          <Link href="/login">Masuk</Link>
          <Link className="rounded-md bg-[#0e5f55] px-4 py-2 text-white" href="/register">
            Mulai Latihan
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl gap-10 py-20 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.08em] text-[#0e5f55]">
            MVP setup
          </p>
          <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-normal">
            Latihan interview kerja dengan AI interviewer berbasis suara
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#52615c]">
            Fondasi Intervue sudah disiapkan untuk landing, auth, target lamaran, interview room,
            dan report berbasis API backend.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              className="rounded-md bg-[#0e5f55] px-5 py-3 font-semibold text-white"
              href="/register"
            >
              Mulai Latihan
            </Link>
            <Link
              className="rounded-md border border-[#bac8c1] px-5 py-3 font-semibold"
              href="/dashboard"
            >
              Lihat Dashboard
            </Link>
          </div>
        </div>

        <aside className="rounded-lg border border-[#d8ded8] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e7ece7] pb-4">
            <div>
              <p className="text-sm text-[#6b7974]">Backend health</p>
              <p className="text-2xl font-semibold">
                {health.data?.status === 'ok' ? 'Online' : 'Offline'}
              </p>
            </div>
            <span
              className={`h-3 w-3 rounded-full ${
                health.data?.status === 'ok' ? 'bg-[#0e5f55]' : 'bg-[#b84c4c]'
              }`}
            />
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[#6b7974]">Frontend</dt>
              <dd className="font-medium">Next.js</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6b7974]">Backend</dt>
              <dd className="font-medium">Express</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#6b7974]">Database</dt>
              <dd className="font-medium">PostgreSQL + Prisma</dd>
            </div>
          </dl>
        </aside>
      </section>
    </main>
  );
}
