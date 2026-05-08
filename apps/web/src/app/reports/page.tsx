import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { ScoreMeter } from '@/components/voice/score-meter';
import { requireAuth } from '@/lib/auth-server';

export default async function ReportsPage() {
  const user = await requireAuth();

  return (
    <AppShell
      activeHref="/reports"
      description="Placeholder report untuk menjaga shell navigasi. Report final masuk Phase 8."
      title="Report"
      user={user}
    >
      <Card className="p-6">
        <h2 className="font-[var(--font-jakarta)] text-2xl font-extrabold">Preview skor sesi</h2>
        <div className="mt-6 max-w-md">
          <ScoreMeter label="Overall readiness" value={0} />
        </div>
      </Card>
    </AppShell>
  );
}
