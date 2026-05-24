'use client';

import type {
  HistorySessionSummary,
  InterviewSessionDetail,
  InterviewTurn,
  SessionReport,
} from '@intervue/shared';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScoreMeter } from '@/components/voice/score-meter';
import { getReport, getSession, listHistory } from '@/lib/api-client';

function average(values: number[]) {
  return values.length > 0
    ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
    : 0;
}

function completedTurns(session: InterviewSessionDetail) {
  return session.turns
    .filter((turn) => turn.answerTranscript)
    .sort((a, b) => a.turnIndex - b.turnIndex);
}

function metricValue(value: number | null | undefined) {
  return value === null || value === undefined ? 'Tidak tersedia' : `${Math.round(value)}/100`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Belum tersedia';
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function ReportsSessionCard({ session }: { session: HistorySessionSummary }) {
  const targetSubtitle = [session.targetCompany, session.targetIndustry].filter(Boolean).join(' - ');

  return (
    <Card className="p-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="success">Completed</Badge>
            <Badge tone="neutral">
              {session.mode === 'full_simulation' ? 'Full simulation' : 'Quick practice'}
            </Badge>
          </div>
          <h2 className="mt-4 font-[var(--font-jakarta)] text-2xl font-black leading-tight text-[var(--foreground)]">
            {session.targetRole || 'Target interview'}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--muted)]">
            {targetSubtitle || 'Target lamaran tanpa perusahaan'}
          </p>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Score
              </p>
              <p className="mt-1 text-xl font-black text-[var(--primary)]">
                {session.overallScore === null ? 'N/A' : `${session.overallScore}/100`}
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Questions
              </p>
              <p className="mt-1 text-xl font-black">
                {session.completedQuestionCount}/{session.plannedQuestionCount}
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Selesai
              </p>
              <p className="mt-1 font-bold">{formatDateTime(session.endedAt ?? session.updatedAt)}</p>
            </div>
          </div>
        </div>
        <Button className="w-full" href={`/reports?sessionId=${session.id}`}>
          Buka analitik
        </Button>
      </div>
    </Card>
  );
}

function ReportTurnCard({ turn }: { turn: InterviewTurn }) {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge tone="neutral">Pertanyaan {turn.turnIndex}</Badge>
          <h2 className="mt-4 max-w-3xl font-[var(--font-jakarta)] text-xl font-black leading-tight text-[var(--foreground)]">
            {turn.questionText}
          </h2>
        </div>
        <div className="min-w-28 text-right">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            Gemini
          </p>
          <p className="mt-1 font-[var(--font-jakarta)] text-2xl font-black text-[var(--primary)]">
            {metricValue(turn.evaluation?.answerScore)}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
            Transcript
          </p>
          <p className="mt-3 rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--foreground)]">
            {turn.answerTranscript}
          </p>

          {turn.evaluation ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-black text-[var(--foreground)]">Strengths</h3>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--muted)]">
                  {turn.evaluation.strengths.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-black text-[var(--foreground)]">Improvements</h3>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-[var(--muted)]">
                  {turn.evaluation.improvements.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Speech baseline
            </p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-[var(--muted)]">Delivery</dt>
                <dd className="font-black">{metricValue(turn.deliveryQuality)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-[var(--muted)]">Fluency</dt>
                <dd className="font-black">{metricValue(turn.fluencyScore)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="font-semibold text-[var(--muted)]">Confidence</dt>
                <dd className="font-black">{metricValue(turn.confidenceSignal)}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-white/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
              Non-verbal ML
            </p>
            <p className="mt-3 text-lg font-black text-[var(--foreground)]">
              {metricValue(turn.nonverbalScore)}
            </p>
            {turn.nonverbalError ? (
              <p className="mt-2 text-xs font-semibold leading-5 text-[var(--danger)]">
                {turn.nonverbalError}
              </p>
            ) : null}
          </div>
        </aside>
      </div>

      {turn.evaluation?.betterAnswerExample ? (
        <div className="mt-5 rounded-[var(--radius-sm)] bg-[rgb(18_60_55_/_0.06)] p-4 text-sm leading-6 text-[var(--muted)]">
          <span className="font-black text-[var(--foreground)]">Contoh jawaban: </span>
          {turn.evaluation.betterAnswerExample}
        </div>
      ) : null}
    </Card>
  );
}

function ReportSummary({ report }: { report: SessionReport | null }) {
  if (!report) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center">
        <ScoreMeter label="Overall answer score" value={report.overallScore} />
        <div>
          <Badge tone="success">Completed</Badge>
          <h2 className="mt-4 font-[var(--font-jakarta)] text-3xl font-black tracking-[-0.03em] text-[var(--foreground)]">
            Summary akhir interview
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Speech avg
              </p>
              <p className="mt-1 text-2xl font-black">
                {report.speechSummary.deliveryQuality ?? 0}/100
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Weakest dimension
              </p>
              <p className="mt-1 text-lg font-black">
                {
                  Object.entries(report.dimensionSummary).sort(
                    ([, left], [, right]) => left - right,
                  )[0]?.[0]
                }
              </p>
            </div>
            <div className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Recommendations
              </p>
              <p className="mt-1 text-2xl font-black">{report.recommendations.length}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ReportsPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');
  const [session, setSession] = useState<InterviewSessionDetail | null>(null);
  const [report, setReport] = useState<SessionReport | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(sessionId));
  const [historySessions, setHistorySessions] = useState<HistorySessionSummary[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(!sessionId);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    if (!sessionId) {
      setSession(null);
      setReport(null);
      setError(null);
      setIsLoading(false);
      setIsHistoryLoading(true);

      const historyResponse = await listHistory();
      setHistorySessions(historyResponse.data?.sessions ?? []);

      if (historyResponse.error) {
        setError(historyResponse.error.message);
      }

      setIsHistoryLoading(false);
      return;
    }

    setHistorySessions([]);
    setIsHistoryLoading(false);
    setIsLoading(true);
    setError(null);
    const reportResponse = await getReport(sessionId);

    if (reportResponse.data) {
      setSession(reportResponse.data.session);
      setReport(reportResponse.data.report);
      setIsLoading(false);
      return;
    }

    const fallbackResponse = await getSession(sessionId);
    if (fallbackResponse.data) {
      setSession(fallbackResponse.data.session);
      setReport(null);
      setIsLoading(false);
      return;
    }

    setSession(null);
    setReport(null);
    setError(fallbackResponse.error?.message ?? reportResponse.error?.message ?? 'Report gagal dimuat.');
    setIsLoading(false);
  }, [sessionId]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const turns = session ? completedTurns(session) : [];
  const answerScores = turns.flatMap((turn) =>
    turn.evaluation?.answerScore === undefined ? [] : [turn.evaluation.answerScore],
  );
  const deliveryScores = turns.flatMap((turn) =>
    turn.deliveryQuality === null || turn.deliveryQuality === undefined
      ? []
      : [turn.deliveryQuality],
  );
  const nonverbalScores = turns.flatMap((turn) =>
    turn.nonverbalScore === null || turn.nonverbalScore === undefined ? [] : [turn.nonverbalScore],
  );
  const overallScore = average(answerScores);

  return (
    <AppShell
      activeHref="/reports"
      description="Analitik dan report dari sesi interview yang sudah selesai."
      title="Analitik"
    >
      {!sessionId ? (
        <div className="space-y-5">
          <Card className="p-6">
            <Badge tone="neutral">
              {isHistoryLoading ? 'Memuat sesi' : `${historySessions.length} sesi selesai`}
            </Badge>
            <h2 className="mt-4 font-[var(--font-jakarta)] text-3xl font-black tracking-[-0.03em] text-[var(--foreground)]">
              Pilih sesi untuk melihat analitik.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Analitik dibuat dari sesi interview yang sudah selesai. Buka salah satu sesi untuk
              melihat skor, evaluasi jawaban, sinyal speech, dan metrik non-verbal.
            </p>
          </Card>

          {error ? (
            <Card className="border-[#f4b8b8] bg-[#fff5f5] p-6">
              <Badge tone="warning">Analitik error</Badge>
              <h2 className="mt-4 font-[var(--font-jakarta)] text-2xl font-extrabold text-[var(--danger)]">
                Daftar sesi belum bisa dimuat
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{error}</p>
              <div className="mt-5">
                <Button onClick={loadReport} variant="outline">
                  Coba lagi
                </Button>
              </div>
            </Card>
          ) : null}

          {isHistoryLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((item) => (
                <Card className="h-40 animate-pulse bg-white/60 p-5" key={item}>
                  <span className="sr-only">Memuat sesi analitik</span>
                </Card>
              ))}
            </div>
          ) : historySessions.length > 0 ? (
            <section className="space-y-4">
              {historySessions.map((historySession) => (
                <ReportsSessionCard key={historySession.id} session={historySession} />
              ))}
            </section>
          ) : !error ? (
            <Card className="p-7 sm:p-8">
              <Badge tone="primary">Belum ada data</Badge>
              <h2 className="mt-5 max-w-2xl font-[var(--font-jakarta)] text-3xl font-black leading-tight tracking-[-0.03em] text-[var(--foreground)]">
                Selesaikan satu sesi untuk membuka analitik.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
                Setelah interview selesai, sesi akan tersimpan di Riwayat Sesi dan muncul di
                halaman Analitik.
              </p>
              <div className="mt-6">
                <Button href="/interview">Mulai interview</Button>
              </div>
            </Card>
          ) : null}
        </div>
      ) : isLoading ? (
        <Card className="p-6">
          <Badge tone="neutral">Memuat</Badge>
          <div className="mt-5 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center">
            <div className="h-56 animate-pulse rounded-full bg-[var(--surface-muted)]" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 animate-pulse rounded bg-[var(--surface-muted)]" />
              <div className="h-4 w-full animate-pulse rounded bg-[var(--surface-muted)]" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-[var(--surface-muted)]" />
              <div className="grid gap-3 sm:grid-cols-3">
                {['speech', 'nonverbal', 'questions'].map((item) => (
                  <div
                    className="h-24 animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-muted)]"
                    key={item}
                  />
                ))}
              </div>
            </div>
          </div>
        </Card>
      ) : error ? (
        <Card className="border-[#f4b8b8] bg-[#fff5f5] p-6">
          <Badge tone="warning">Report error</Badge>
          <h2 className="mt-4 font-[var(--font-jakarta)] text-2xl font-extrabold text-[var(--danger)]">
            Report tidak bisa dibuka
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {error}
          </p>
          <div className="mt-5">
            <Button onClick={loadReport} variant="outline">
              Coba lagi
            </Button>
          </div>
        </Card>
      ) : session ? (
        <div className="space-y-5">
          {report ? (
            <ReportSummary report={report} />
          ) : (
            <Card className="overflow-hidden p-6">
              <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center">
                <ScoreMeter label="Overall answer score" value={overallScore} />
                <div>
                  <Badge tone={session.status === 'completed' ? 'success' : 'warning'}>
                    {session.status === 'completed' ? 'Completed' : 'Belum selesai'}
                  </Badge>
                  <h2 className="mt-4 font-[var(--font-jakarta)] text-3xl font-black tracking-[-0.03em] text-[var(--foreground)]">
                    {session.targetApplication.role}
                    {session.targetApplication.company
                      ? ` at ${session.targetApplication.company}`
                      : ''}
                  </h2>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)]">
                    Score utama memakai rata-rata Gemini answer score. Speech baseline dan
                    non-verbal ML ditampilkan sebagai sinyal pendukung agar interpretasi tidak
                    tercampur.
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Speech avg
                      </p>
                      <p className="mt-1 text-2xl font-black">{average(deliveryScores)}/100</p>
                    </div>
                    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Non-verbal avg
                      </p>
                      <p className="mt-1 text-2xl font-black">
                        {nonverbalScores.length > 0 ? `${average(nonverbalScores)}/100` : 'N/A'}
                      </p>
                    </div>
                    <div className="rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                        Questions
                      </p>
                      <p className="mt-1 text-2xl font-black">
                        {session.completedQuestionCount}/{session.plannedQuestionCount}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {turns.map((turn) => (
            <ReportTurnCard key={turn.id} turn={turn} />
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}

export default function ReportsPage() {
  return (
    <Suspense
      fallback={
        <AppShell
          activeHref="/reports"
          description="Analitik dan report dari sesi interview yang sudah selesai."
          title="Analitik"
        >
          <Card className="p-6">
            <Badge tone="neutral">Memuat</Badge>
            <div className="mt-5 h-56 animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-muted)]" />
          </Card>
        </AppShell>
      }
    >
      <ReportsPageContent />
    </Suspense>
  );
}
