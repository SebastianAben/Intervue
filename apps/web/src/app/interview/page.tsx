import type { SessionMode, TargetApplication } from '@intervue/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { requireAuth } from '@/lib/auth-server';
import { cn } from '@/lib/cn';
import { createSession, getSession, listTargets, startSession } from '@/lib/api-client';
import { InterviewRoom } from './interview-room';
import { SpeechCapabilityCheck } from './speech-capability-check';

const modeOptions: Array<{
  value: SessionMode;
  label: string;
  description: string;
}> = [
  {
    value: 'practice',
    label: 'Practice',
    description: 'Dapatkan feedback setelah setiap jawaban untuk latihan bertahap.',
  },
  {
    value: 'full_simulation',
    label: 'Full simulation',
    description: 'Selesaikan semua pertanyaan dulu, lalu lihat report akhir.',
  },
];

const questionCountOptions = [3, 5, 7];

async function createSessionAction(formData: FormData) {
  'use server';

  const payload = {
    targetApplicationId: String(formData.get('targetApplicationId') ?? ''),
    mode: String(formData.get('mode') ?? 'practice') as SessionMode,
    plannedQuestionCount: Number(formData.get('plannedQuestionCount') ?? 5),
  };

  const cookieHeader = (await cookies()).toString();
  const response = await createSession(payload, { cookie: cookieHeader });

  if (response.error) {
    const message = encodeURIComponent(response.error.message);
    redirect(`/interview?error=${message}`);
  }

  redirect(`/interview?sessionId=${response.data.session.id}`);
}

function TargetOption({ isSelected, target }: { isSelected: boolean; target: TargetApplication }) {
  return (
    <label
      className={cn(
        'block cursor-pointer rounded-[var(--radius-md)] border bg-white p-4 transition-colors',
        isSelected
          ? 'border-[var(--primary-600)] shadow-[0_0_0_3px_rgb(13_77_77_/_0.12)]'
          : 'border-[var(--border)] hover:border-[var(--primary-600)]',
      )}
    >
      <input
        className="sr-only"
        defaultChecked={isSelected}
        name="targetApplicationId"
        required
        type="radio"
        value={target.id}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-[var(--font-jakarta)] text-lg font-extrabold text-[var(--foreground)]">
            {target.role}
          </h3>
          <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
            {[target.company, target.industry].filter(Boolean).join(' - ') || target.level}
          </p>
        </div>
        <Badge tone="success">Aktif</Badge>
      </div>
      {target.skillRequirements ? (
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-[var(--muted)]">
          {target.skillRequirements}
        </p>
      ) : null}
    </label>
  );
}

export default async function InterviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ targetId?: string; sessionId?: string; error?: string }>;
}) {
  const user = await requireAuth();
  const params = searchParams ? await searchParams : {};
  const cookieHeader = (await cookies()).toString();
  const targetResponse = await listTargets({ status: 'active', cookie: cookieHeader });
  const targets = targetResponse.data?.targets ?? [];
  const selectedTargetId =
    targets.find((target) => target.id === params.targetId)?.id ?? targets[0]?.id ?? null;

  if (params.sessionId) {
    const sessionResponse = await getSession(params.sessionId, { cookie: cookieHeader });
    const startedResponse =
      sessionResponse.data?.session.status === 'setup'
        ? await startSession(params.sessionId, { cookie: cookieHeader })
        : sessionResponse;

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
              Session tidak bisa dibuka
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {startedResponse.error.message}
            </p>
            <div className="mt-6">
              <Button href="/interview" variant="outline">
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

  return (
    <AppShell
      activeHref="/interview"
      description="Pilih konteks target, mode sesi, dan cek kesiapan mikrofon sebelum mulai."
      title="Interview Setup"
      user={user}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <form action={createSessionAction} className="space-y-5">
            {params.error ? (
              <Card className="border-[#f4b8b8] bg-[#fff5f5] p-4 text-sm font-semibold text-[var(--danger)]">
                {params.error}
              </Card>
            ) : null}

            <Card className="p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <Badge tone="primary">Target lamaran</Badge>
                  <h2 className="mt-4 font-[var(--font-jakarta)] text-xl font-extrabold text-[var(--foreground)]">
                    Pilih konteks interview
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Pertanyaan akan disesuaikan dengan role, industri, skill, dan ringkasan
                    pengalaman dari target yang dipilih.
                  </p>
                </div>
                <Button href="/targets?new=1" size="sm" variant="outline">
                  Target Baru
                </Button>
              </div>

              <div className="mt-5 grid gap-3">
                {targets.length > 0 ? (
                  targets.map((target) => (
                    <TargetOption
                      isSelected={target.id === selectedTargetId}
                      key={target.id}
                      target={target}
                    />
                  ))
                ) : (
                  <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--input-border)] bg-[var(--surface-muted)] p-5">
                    <p className="text-sm font-semibold text-[var(--foreground)]">
                      Belum ada target lamaran aktif.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                      Buat target terlebih dahulu agar session interview punya konteks.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5">
              <Badge tone="primary">Mode sesi</Badge>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {modeOptions.map((option, index) => (
                  <label
                    className="cursor-pointer rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4 transition-colors hover:border-[var(--primary-600)] has-[:checked]:border-[var(--primary-600)] has-[:checked]:shadow-[0_0_0_3px_rgb(13_77_77_/_0.12)]"
                    key={option.value}
                  >
                    <input
                      className="sr-only"
                      defaultChecked={index === 0}
                      name="mode"
                      type="radio"
                      value={option.value}
                    />
                    <span className="block font-[var(--font-jakarta)] text-lg font-extrabold text-[var(--foreground)]">
                      {option.label}
                    </span>
                    <span className="mt-2 block text-sm leading-6 text-[var(--muted)]">
                      {option.description}
                    </span>
                  </label>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <Badge tone="primary">Jumlah pertanyaan</Badge>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {questionCountOptions.map((count) => (
                  <label
                    className="cursor-pointer rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4 text-center transition-colors hover:border-[var(--primary-600)] has-[:checked]:border-[var(--primary-600)] has-[:checked]:shadow-[0_0_0_3px_rgb(13_77_77_/_0.12)]"
                    key={count}
                  >
                    <input
                      className="sr-only"
                      defaultChecked={count === 5}
                      name="plannedQuestionCount"
                      type="radio"
                      value={count}
                    />
                    <span className="font-[var(--font-jakarta)] text-2xl font-extrabold text-[var(--primary)]">
                      {count}
                    </span>
                    <span className="mt-1 block text-sm font-semibold text-[var(--muted)]">
                      pertanyaan
                    </span>
                  </label>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <Badge tone="warning">Data notice</Badge>
              <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                Intervue mengirim transcript, durasi, dan metadata ringan ke backend untuk evaluasi
                dengan Gemini free tier dan model speech analytics lokal. Audio mentah tidak
                disimpan pada MVP.
              </p>
            </Card>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button href="/dashboard" type="button" variant="ghost">
                Kembali
              </Button>
              <Button disabled={targets.length === 0} type="submit">
                Buat Session Interview
              </Button>
            </div>
          </form>

          <div className="space-y-5">
            <SpeechCapabilityCheck />
            <Card className="p-5">
              <Badge tone="neutral">Fallback</Badge>
              <h2 className="mt-4 font-[var(--font-jakarta)] text-xl font-extrabold text-[var(--foreground)]">
                Jika speech recognition gagal
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                Interview room berikutnya tetap harus menyediakan transcript edit dan input teks
                manual agar user tidak terblokir oleh browser.
              </p>
            </Card>
          </div>
      </div>
    </AppShell>
  );
}
