import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScoreMeter } from '@/components/voice/score-meter';
import { StatusChip } from '@/components/voice/status-chip';
import { requireAuth } from '@/lib/auth-server';
import { listTargets } from '@/lib/api-client';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const user = await requireAuth();
  const cookieHeader = (await cookies()).toString();
  const targetResponse = await listTargets({ status: 'active', cookie: cookieHeader });
  const activeTargets = targetResponse.data?.targets ?? [];
  const recentTargets = activeTargets.slice(0, 3);

  return (
    <AppShell
      activeHref="/dashboard"
      description="Ringkasan workspace latihan interview dan target lamaran aktif."
      title="Dashboard"
      user={user}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="relative overflow-hidden rounded-[var(--radius-lg)] p-7">
          <div className="absolute right-0 top-0 h-44 w-44 translate-x-16 -translate-y-16 rounded-full bg-[var(--accent)]/30 blur-3xl" />
          <Badge tone={activeTargets.length > 0 ? 'success' : 'primary'}>
            {activeTargets.length > 0 ? `${activeTargets.length} target aktif` : 'Belum ada target'}
          </Badge>
          <h2 className="relative mt-5 max-w-2xl font-[var(--font-jakarta)] text-3xl font-black leading-tight tracking-[-0.03em] text-[var(--foreground)]">
            {activeTargets.length > 0
              ? 'Lanjutkan latihan berbasis target'
              : 'Buat target lamaran pertama'}
          </h2>
          <p className="relative mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            {activeTargets.length > 0
              ? 'Pilih target lamaran aktif saat memulai sesi agar pertanyaan interview tetap relevan dengan posisi yang diincar.'
              : 'Target lamaran membuat pertanyaan interview lebih relevan dengan posisi, perusahaan, industri, dan skill yang ingin dilatih.'}
          </p>
          <div className="relative mt-7 flex flex-wrap gap-3">
            <Button href="/targets">
              {activeTargets.length > 0 ? 'Kelola Target Lamaran' : 'Buat Target Lamaran'}
            </Button>
            <Button href="/interview" variant="outline">
              Latihan Cepat
            </Button>
          </div>
        </Card>

        <Card className="rounded-[var(--radius-lg)] p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-[var(--font-jakarta)] text-xl font-black tracking-[-0.02em]">
              Status sesi
            </h2>
            <StatusChip status="ready" />
          </div>
          <div className="mt-6 space-y-5">
            <ScoreMeter label="Kesiapan interview" value={0} />
            <ScoreMeter label="Konsistensi latihan" value={0} />
          </div>
        </Card>
      </div>

      <div className="mt-6 overflow-hidden rounded-[var(--radius-lg)] border border-white/80 bg-white/72 shadow-[var(--shadow-card)] backdrop-blur">
        {[
          [
            'Target aktif',
            String(activeTargets.length),
            activeTargets.length > 0
              ? 'Target siap dipakai untuk simulasi interview.'
              : 'Tambahkan target sebelum simulasi penuh.',
          ],
          ['Sesi latihan', '0', 'History akan muncul setelah interview.'],
          ['Report tersimpan', '0', 'Report dibuat saat sesi selesai.'],
        ].map(([label, value, description]) => (
          <div
            className="grid gap-3 border-b border-[var(--border)] p-5 last:border-b-0 sm:grid-cols-[180px_90px_1fr] sm:items-center"
            key={label}
          >
            <p className="text-sm font-bold text-[var(--muted)]">{label}</p>
            <p className="font-[var(--font-geist-mono)] text-4xl font-semibold tabular-nums text-[var(--primary)]">
              {value}
            </p>
            <p className="text-sm leading-6 text-[var(--muted)]">{description}</p>
          </div>
        ))}
      </div>

      {recentTargets.length > 0 ? (
        <section className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-[var(--font-jakarta)] text-xl font-extrabold text-[var(--foreground)]">
              Target terbaru
            </h2>
            <Button href="/targets" size="sm" variant="ghost">
              Lihat semua
            </Button>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {recentTargets.map((target) => (
              <Card
                className="rounded-[var(--radius-lg)] p-5 transition-transform duration-300 hover:-translate-y-1"
                key={target.id}
              >
                <div className="flex flex-wrap gap-2">
                  <Badge tone="success">Aktif</Badge>
                  <Badge>{target.interviewType}</Badge>
                </div>
                <h3 className="mt-4 font-[var(--font-jakarta)] text-lg font-extrabold text-[var(--foreground)]">
                  {target.role}
                </h3>
                <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
                  {[target.company, target.industry].filter(Boolean).join(' • ')}
                </p>
                {target.skillRequirements ? (
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
                    {target.skillRequirements}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </AppShell>
  );
}
