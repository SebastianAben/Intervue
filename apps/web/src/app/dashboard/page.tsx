import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScoreMeter } from '@/components/voice/score-meter';
import { StatusChip } from '@/components/voice/status-chip';
import { requireAuth } from '@/lib/auth-server';

export default async function DashboardPage() {
  const user = await requireAuth();

  return (
    <AppShell
      activeHref="/dashboard"
      description="Ringkasan workspace latihan interview. Data masih placeholder untuk Phase 1."
      title="Dashboard"
      user={user}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-6">
          <Badge tone="primary">Belum ada target</Badge>
          <h2 className="mt-5 font-[var(--font-jakarta)] text-2xl font-extrabold text-[var(--foreground)]">
            Buat target lamaran pertama
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Target lamaran membuat pertanyaan interview lebih relevan dengan posisi, perusahaan,
            industri, dan skill yang ingin dilatih.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/targets">Buat Target Lamaran</Button>
            <Button href="/interview" variant="outline">
              Latihan Cepat
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-[var(--font-jakarta)] text-xl font-extrabold">Status sesi</h2>
            <StatusChip status="ready" />
          </div>
          <div className="mt-6 space-y-5">
            <ScoreMeter label="Kesiapan interview" value={0} />
            <ScoreMeter label="Konsistensi latihan" value={0} />
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {[
          ['Target aktif', '0', 'Tambahkan target sebelum simulasi penuh.'],
          ['Sesi latihan', '0', 'History akan muncul setelah interview.'],
          ['Report tersimpan', '0', 'Report dibuat saat sesi selesai.'],
        ].map(([label, value, description]) => (
          <Card className="p-5" key={label}>
            <p className="text-sm font-bold text-[var(--muted)]">{label}</p>
            <p className="mt-3 font-[var(--font-jakarta)] text-4xl font-extrabold text-[var(--primary)]">
              {value}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
