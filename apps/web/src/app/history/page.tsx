import type { HistorySessionSummary, SessionMode, SessionStatus } from '@intervue/shared';
import { cookies } from 'next/headers';
import { AppShell } from '@/components/layout/app-shell';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { requireAuth } from '@/lib/auth-server';
import { listHistory, listTargets } from '@/lib/api-client';
import { cn } from '@/lib/cn';

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: 'short',
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
});

const statusMeta: Record<SessionStatus, { label: string; tone: BadgeTone; description: string }> = {
  abandoned: {
    description: 'Sesi dihentikan sebelum semua pertanyaan selesai.',
    label: 'Abandoned',
    tone: 'warning',
  },
  active: {
    description: 'Sesi masih berjalan.',
    label: 'Active',
    tone: 'primary',
  },
  completed: {
    description: 'Semua jawaban tersimpan dan report siap dibuka.',
    label: 'Completed',
    tone: 'success',
  },
  failed: {
    description: 'Sesi gagal karena kendala evaluasi atau pemrosesan.',
    label: 'Failed',
    tone: 'danger',
  },
  setup: {
    description: 'Sesi baru dibuat tetapi belum dimulai.',
    label: 'Setup',
    tone: 'neutral',
  },
};

const modeLabels: Record<SessionMode, string> = {
  full_simulation: 'Full simulation',
  practice: 'Practice',
};

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : 'Belum tersedia';
}

function scoreLabel(value: number | null) {
  return value === null ? 'N/A' : `${value}/100`;
}

function targetSubtitle(session: HistorySessionSummary) {
  return [session.targetCompany, session.targetIndustry].filter(Boolean).join(' - ');
}

function HistoryEmptyState({
  filtered,
  selectedTargetLabel,
}: {
  filtered: boolean;
  selectedTargetLabel?: string;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,0.88fr)_320px]">
        <div className="p-7 sm:p-8">
          <Badge tone={filtered ? 'warning' : 'primary'}>
            {filtered ? 'Filter kosong' : 'History kosong'}
          </Badge>
          <h2 className="mt-5 max-w-2xl font-[var(--font-jakarta)] text-3xl font-black leading-tight tracking-[-0.03em] text-[var(--foreground)]">
            {filtered ? 'Belum ada sesi untuk target ini.' : 'Mulai satu sesi untuk membangun pola latihan.'}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {filtered
              ? `${selectedTargetLabel ?? 'Target terpilih'} belum punya sesi completed, abandoned, atau failed. Pilih target lain atau mulai interview baru.`
              : 'History akan menampilkan target, mode, status, skor, jumlah pertanyaan, tanggal sesi, dan akses report setelah interview selesai atau dihentikan.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/interview">Mulai interview</Button>
            {filtered ? (
              <Button href="/history" variant="outline">
                Reset filter
              </Button>
            ) : (
              <Button href="/targets" variant="outline">
                Kelola target
              </Button>
            )}
          </div>
        </div>
        <div className="border-t border-[var(--border)] bg-[var(--surface-muted)] p-6 lg:border-l lg:border-t-0">
          <div className="space-y-3">
            {['Target dan role', 'Skor jawaban', 'Report detail'].map((item, index) => (
              <div
                className="rounded-[var(--radius-md)] border border-white/80 bg-white/72 p-4 shadow-[0_1px_2px_rgb(23_27_26_/_0.04)]"
                key={item}
              >
                <p className="font-[var(--font-geist-mono)] text-xs font-semibold text-[var(--muted)]">
                  0{index + 1}
                </p>
                <p className="mt-2 text-sm font-black text-[var(--foreground)]">{item}</p>
                <div className="mt-3 h-2 rounded-full bg-[rgb(18_60_55_/_0.08)]">
                  <div
                    className="h-2 rounded-full bg-[var(--primary-muted)]"
                    style={{ width: `${42 + index * 18}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function HistoryErrorCard({ message }: { message: string }) {
  return (
    <Card className="border-[#f4b8b8] bg-[#fff5f5] p-6">
      <Badge tone="danger">History error</Badge>
      <h2 className="mt-4 font-[var(--font-jakarta)] text-2xl font-black text-[var(--danger)]">
        History belum bisa dimuat
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
        {message || 'Backend belum mengembalikan daftar sesi. Coba ulangi setelah koneksi API siap.'}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button href="/history" variant="outline">
          Coba lagi
        </Button>
        <Button href="/interview" variant="ghost">
          Ke interview
        </Button>
      </div>
    </Card>
  );
}

function HistorySessionCard({ session }: { session: HistorySessionSummary }) {
  const meta = statusMeta[session.status];
  const completedRatio =
    session.plannedQuestionCount > 0
      ? Math.round((session.completedQuestionCount / session.plannedQuestionCount) * 100)
      : 0;

  return (
    <article className="group overflow-hidden rounded-[var(--radius-lg)] border border-white/80 bg-white/78 shadow-[var(--shadow-card)] backdrop-blur transition-transform duration-300 hover:-translate-y-0.5">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_210px]">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={meta.tone}>{meta.label}</Badge>
                <Badge tone="neutral">{modeLabels[session.mode]}</Badge>
              </div>
              <h2 className="mt-4 font-[var(--font-jakarta)] text-2xl font-black leading-tight tracking-[-0.03em] text-[var(--foreground)]">
                {session.targetRole}
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted)]">
                {targetSubtitle(session) || 'Target lamaran tanpa perusahaan'}
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 sm:text-right">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Score
              </p>
              <p className="mt-1 font-[var(--font-geist-mono)] text-3xl font-semibold tabular-nums text-[var(--primary)]">
                {scoreLabel(session.overallScore)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_1.2fr]">
            <div className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Questions
              </p>
              <p className="mt-1 text-lg font-black text-[var(--foreground)]">
                {session.completedQuestionCount}/{session.plannedQuestionCount}
              </p>
              <div className="mt-3 h-2 rounded-full bg-white">
                <div
                  className={cn(
                    'h-2 rounded-full',
                    session.status === 'failed' ? 'bg-[var(--danger)]' : 'bg-[var(--primary)]',
                  )}
                  style={{ width: `${Math.min(100, completedRatio)}%` }}
                />
              </div>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Dibuat
              </p>
              <p className="mt-2 text-sm font-black leading-6 text-[var(--foreground)]">
                {formatDate(session.createdAt)}
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Selesai
              </p>
              <p className="mt-2 text-sm font-black leading-6 text-[var(--foreground)]">
                {formatDate(session.endedAt ?? session.updatedAt)}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm leading-6 text-[var(--muted)]">{meta.description}</p>
        </div>

        <aside className="flex flex-col justify-between gap-5 border-t border-[var(--border)] bg-[rgb(18_60_55_/_0.045)] p-5 lg:border-l lg:border-t-0">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-semibold text-[var(--muted)]">Started</dt>
              <dd className="mt-1 font-black text-[var(--foreground)]">
                {formatDate(session.startedAt)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-[var(--muted)]">Report</dt>
              <dd className="mt-1 font-black text-[var(--foreground)]">
                {session.hasReport ? 'Tersedia' : 'Detail sesi'}
              </dd>
            </div>
          </dl>
          <Button
            className="w-full"
            href={`/reports?sessionId=${session.id}`}
            variant={session.hasReport ? 'primary' : 'outline'}
          >
            {session.hasReport ? 'Buka report' : 'Lihat detail'}
          </Button>
        </aside>
      </div>
    </article>
  );
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ targetApplicationId?: string }>;
}) {
  const user = await requireAuth();
  const params = searchParams ? await searchParams : {};
  const selectedTargetId = params.targetApplicationId ?? 'all';
  const cookieHeader = (await cookies()).toString();
  const targetFilter = selectedTargetId === 'all' ? undefined : selectedTargetId;
  const [targetResponse, historyResponse] = await Promise.all([
    listTargets({ status: 'active', cookie: cookieHeader }),
    listHistory({ cookie: cookieHeader, targetApplicationId: targetFilter }),
  ]);
  const activeTargets = targetResponse.data?.targets ?? [];
  const sessions = historyResponse.data?.sessions ?? [];
  const selectedTarget = activeTargets.find((target) => target.id === selectedTargetId);
  const completedCount = sessions.filter((session) => session.status === 'completed').length;
  const reportCount = sessions.filter((session) => session.hasReport).length;
  const averageScore = Math.round(
    sessions.reduce((sum, session) => sum + (session.overallScore ?? 0), 0) /
      Math.max(1, sessions.filter((session) => session.overallScore !== null).length),
  );

  return (
    <AppShell
      activeHref="/history"
      description="Daftar sesi interview yang sudah selesai, gagal, atau dihentikan."
      title="History"
      user={user}
    >
      <div className="space-y-5">
        <Card className="relative overflow-hidden p-6 sm:p-7">
          <div className="absolute right-0 top-0 h-44 w-44 translate-x-16 -translate-y-20 rounded-full bg-[var(--accent)]/25 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div>
              <Badge tone="primary">{sessions.length} sesi tersimpan</Badge>
              <h2 className="mt-5 max-w-3xl font-[var(--font-jakarta)] text-3xl font-black leading-tight tracking-[-0.035em] text-[var(--foreground)] sm:text-4xl">
                Riwayat latihan untuk membaca progres per target.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Filter berdasarkan target aktif, buka report sesi selesai, atau cek detail sesi
                yang gagal agar langkah retry berikutnya lebih jelas.
              </p>
            </div>

            <form className="rounded-[var(--radius-lg)] border border-white/80 bg-white/72 p-4 shadow-[0_12px_42px_rgb(18_60_55_/_0.08)] backdrop-blur">
              <Select
                defaultValue={selectedTargetId}
                helperText={
                  targetResponse.error
                    ? 'Target aktif belum bisa dimuat, tetapi history tetap ditampilkan.'
                    : 'Filter hanya memakai target lamaran aktif.'
                }
                label="Filter target"
                name="targetApplicationId"
                options={[
                  { label: 'Semua target', value: 'all' },
                  ...activeTargets.map((target) => ({
                    label: [target.role, target.company].filter(Boolean).join(' - '),
                    value: target.id,
                  })),
                ]}
              />
              <div className="mt-4 flex gap-3">
                <Button className="flex-1" type="submit">
                  Terapkan
                </Button>
                {selectedTargetId !== 'all' ? (
                  <Button href="/history" variant="outline">
                    Reset
                  </Button>
                ) : null}
              </div>
            </form>
          </div>
        </Card>

        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-white/80 bg-white/72 shadow-[var(--shadow-card)] backdrop-blur">
          {[
            ['Completed', String(completedCount), 'Sesi selesai dengan jawaban tersimpan.'],
            ['Report', String(reportCount), 'Report deterministik siap dibuka.'],
            ['Avg score', sessions.some((session) => session.overallScore !== null) ? `${averageScore}/100` : 'N/A', 'Rata-rata dari sesi yang punya skor.'],
          ].map(([label, value, description]) => (
            <div
              className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 sm:grid-cols-[170px_130px_1fr] sm:items-center"
              key={label}
            >
              <p className="text-sm font-bold text-[var(--muted)]">{label}</p>
              <p className="font-[var(--font-geist-mono)] text-3xl font-semibold tabular-nums text-[var(--primary)]">
                {value}
              </p>
              <p className="text-sm leading-6 text-[var(--muted)]">{description}</p>
            </div>
          ))}
        </div>

        {historyResponse.error ? (
          <HistoryErrorCard message={historyResponse.error.message} />
        ) : sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <HistorySessionCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <HistoryEmptyState
            filtered={selectedTargetId !== 'all'}
            selectedTargetLabel={
              selectedTarget
                ? [selectedTarget.role, selectedTarget.company].filter(Boolean).join(' - ')
                : undefined
            }
          />
        )}
      </div>
    </AppShell>
  );
}
