import Image from 'next/image';

const setupSteps = ['Target dikunci', 'Prompt disusun', 'Pertanyaan dibuat'];

export default function InterviewLoading() {
  return (
    <main className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-[var(--background)] px-5 py-6 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100dvh-3rem)] max-w-7xl flex-col">
        <header className="flex items-center justify-between rounded-full border border-white/80 bg-white/72 px-4 py-3 shadow-[0_18px_55px_rgb(18_60_55_/_0.1)] backdrop-blur">
          <span className="flex items-center">
            <Image
              alt="Intervue"
              className="h-14 w-auto object-contain"
              height={132}
              priority
              src="/brand/logo-tulisan-display.png"
              width={250}
            />
          </span>
          <span className="rounded-full border border-[rgb(18_60_55_/_0.1)] bg-[rgb(255_255_255_/_0.76)] px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
            Preparing
          </span>
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:py-14">
          <div className="simulation-rise">
            <div className="mb-8 flex w-fit items-center gap-3 rounded-full border border-white/70 bg-white/72 px-4 py-2 shadow-[0_12px_34px_rgb(18_60_55_/_0.08)] backdrop-blur">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)] interview-loading-breathe" />
              <span className="text-sm font-semibold text-[var(--muted)]">
                Gemini sedang membuat pertanyaan pertama
              </span>
            </div>

            <h1 className="max-w-3xl font-[var(--font-jakarta)] text-4xl font-black leading-[0.96] tracking-[-0.045em] text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Menyiapkan interviewer AI untuk sesi latihanmu.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--muted)]">
              Intervue sedang membaca target lamaran, menyusun konteks pertanyaan, dan membuka
              ruang interview. Halaman akan lanjut otomatis setelah pertanyaan pertama siap.
            </p>

            <div className="mt-10 grid grid-flow-dense gap-3 sm:grid-cols-3">
              {setupSteps.map((step, index) => (
                <div
                  className="rounded-[var(--radius-md)] border border-white/70 bg-white/70 p-4 shadow-[0_16px_38px_rgb(18_60_55_/_0.08)] backdrop-blur interview-loading-rise"
                  key={step}
                  style={{ animationDelay: `${index * 110}ms` }}
                >
                  <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[rgb(18_60_55_/_0.09)]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,var(--primary),var(--accent),var(--primary))] interview-loading-shimmer"
                      style={{ animationDelay: `${index * 160}ms` }}
                    />
                  </div>
                  <p className="text-sm font-bold text-[var(--foreground)]">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-flow-dense gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
            <div className="relative overflow-hidden rounded-[28px] border border-white/80 bg-[rgb(255_255_255_/_0.72)] p-5 shadow-[var(--shadow-card)] backdrop-blur interview-loading-rise">
              <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-[rgb(201_214_107_/_0.32)] blur-3xl" />
              <div className="relative">
                <div className="mb-7 flex items-center justify-between gap-4">
                  <div>
                    <div className="h-3 w-24 rounded-full bg-[rgb(18_60_55_/_0.16)] interview-loading-shimmer" />
                    <div className="mt-3 h-8 w-44 rounded-full bg-[rgb(18_60_55_/_0.09)] interview-loading-shimmer" />
                  </div>
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[var(--primary)] shadow-[0_18px_36px_rgb(18_60_55_/_0.18)]">
                    <span className="h-4 w-4 rounded-full bg-[var(--accent)] interview-loading-breathe" />
                  </div>
                </div>

                <div className="flex h-40 items-end gap-2 rounded-[22px] border border-white/70 bg-[rgb(237_242_239_/_0.74)] p-5">
                  {[42, 72, 54, 96, 58, 84, 46, 78, 62, 90, 48, 70].map((height, index) => (
                    <span
                      aria-hidden="true"
                      className="flex-1 rounded-full bg-[var(--primary)]/80 interview-loading-wave"
                      key={`${height}-${index}`}
                      style={{
                        height: `${height}%`,
                        animationDelay: `${index * 70}ms`,
                      }}
                    />
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  <div className="h-3 w-full rounded-full bg-[rgb(18_60_55_/_0.1)] interview-loading-shimmer" />
                  <div className="h-3 w-10/12 rounded-full bg-[rgb(18_60_55_/_0.09)] interview-loading-shimmer" />
                  <div className="h-3 w-7/12 rounded-full bg-[rgb(18_60_55_/_0.08)] interview-loading-shimmer" />
                </div>
              </div>
            </div>

            <aside className="rounded-[28px] border border-white/80 bg-[var(--primary)] p-5 text-white shadow-[0_22px_60px_rgb(18_60_55_/_0.18)] interview-loading-rise">
              <div className="mb-8 h-2 w-16 rounded-full bg-white/24 interview-loading-shimmer" />
              <p className="text-sm font-semibold leading-6 text-white/72">Status ruang</p>
              <p className="mt-3 font-[var(--font-jakarta)] text-3xl font-black leading-none tracking-[-0.04em]">
                Hampir siap.
              </p>
              <div className="mt-8 space-y-3">
                {['Konteks target', 'Bahasa interview', 'Rubrik feedback'].map((item, index) => (
                  <div
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 px-3 py-3"
                    key={item}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-[var(--accent)] interview-loading-breathe"
                      style={{ animationDelay: `${index * 180}ms` }}
                    />
                    <span className="text-sm font-semibold text-white/82">{item}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
