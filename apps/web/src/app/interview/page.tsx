import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RecordingButton } from '@/components/voice/recording-button';
import { StatusChip } from '@/components/voice/status-chip';
import { WaveformIndicator } from '@/components/voice/waveform-indicator';
import { requireAuth } from '@/lib/auth-server';

export default async function InterviewPage() {
  const user = await requireAuth();

  return (
    <AppShell
      activeHref="/interview"
      description="Primitive voice UI untuk Phase 1. State machine dan Web Speech API masuk Phase 6."
      title="Interview"
      user={user}
    >
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <StatusChip status="ai-speaking" />
            <h2 className="mt-4 font-[var(--font-jakarta)] text-2xl font-extrabold">
              Apa alasan Anda tertarik dengan posisi ini?
            </h2>
          </div>
          <RecordingButton />
        </div>
        <div className="mt-8 rounded-[var(--radius-md)] bg-[var(--surface-muted)] p-5">
          <WaveformIndicator active label="Preview waveform interview" />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button>Submit Transcript</Button>
          <Button variant="outline">Edit Manual</Button>
        </div>
      </Card>
    </AppShell>
  );
}
