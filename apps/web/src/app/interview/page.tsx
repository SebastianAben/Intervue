import { cookies } from 'next/headers';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { requireAuth } from '@/lib/auth-server';
import { getSession, humanizeApiError, startSession } from '@/lib/api-client';
import { InterviewSetupClient } from './interview-setup-client';
import { InterviewRoom } from './interview-room';

function sessionErrorTitle(code?: string) {
  if (code === 'GEMINI_RATE_LIMITED') {
    return 'Gemini sedang penuh';
  }

  if (code === 'AI_EVALUATION_FAILED') {
    return 'Pertanyaan pertama belum bisa dibuat';
  }

  if (code === 'SESSION_NOT_FOUND') {
    return 'Session tidak ditemukan';
  }

  return 'Session tidak bisa dibuka';
}

export default async function InterviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ targetId?: string; sessionId?: string; error?: string }>;
}) {
  const params = searchParams ? await searchParams : {};

  if (!params.sessionId) {
    return <InterviewSetupClient initialError={params.error} initialTargetId={params.targetId} />;
  }

  const user = await requireAuth();
  const cookieHeader = (await cookies()).toString();
  const sessionResponse = await getSession(params.sessionId, { cookie: cookieHeader });
  const startedResponse =
    sessionResponse.data?.session.status === 'setup'
      ? await startSession(params.sessionId, { cookie: cookieHeader })
      : sessionResponse;

  if (!startedResponse.error && startedResponse.data.session.mode === 'full_simulation') {
    return <InterviewRoom initialSession={startedResponse.data.session} />;
  }

  return (
    <AppShell
      activeHref="/interview"
      description="Jawab pertanyaan dengan suara atau fallback teks manual."
      title="Interview Room"
      user={user}
    >
      {startedResponse.error ? (
        <Card className="border-[#f4b8b8] bg-[#fff5f5] p-6">
          <Badge tone="warning">Session error</Badge>
          <h2 className="mt-4 font-[var(--font-jakarta)] text-2xl font-extrabold text-[var(--danger)]">
            {sessionErrorTitle(startedResponse.error.code)}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {humanizeApiError(startedResponse.error)}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href={`/interview?sessionId=${params.sessionId}`} variant="outline">
              Coba lagi
            </Button>
            <Button href="/interview" variant="ghost">
              Kembali ke Setup
            </Button>
          </div>
        </Card>
      ) : (
        <InterviewRoom initialSession={startedResponse.data.session} />
      )}
    </AppShell>
  );
}
