'use client';

import type { SessionMode, TargetApplication } from '@intervue/shared';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createSession, humanizeApiError, listTargets } from '@/lib/api-client';
import { cn } from '@/lib/cn';
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

function TargetOption({
  isSelected,
  onSelect,
  target,
}: {
  isSelected: boolean;
  onSelect: (targetId: string) => void;
  target: TargetApplication;
}) {
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
        checked={isSelected}
        className="sr-only"
        name="targetApplicationId"
        onChange={() => onSelect(target.id)}
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

export function InterviewSetupClient({
  initialError,
  initialTargetId,
}: {
  initialError?: string;
  initialTargetId?: string;
}) {
  const router = useRouter();
  const [targets, setTargets] = useState<TargetApplication[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState(initialTargetId ?? '');
  const [isLoadingTargets, setIsLoadingTargets] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(initialError ?? '');

  const loadTargets = useCallback(async () => {
    setIsLoadingTargets(true);
    const response = await listTargets({ status: 'active' });

    if (response.error) {
      setTargets([]);
      setError(response.error.message);
      setIsLoadingTargets(false);
      return;
    }

    setTargets(response.data.targets);
    setSelectedTargetId((current) => {
      if (response.data.targets.some((target) => target.id === current)) {
        return current;
      }

      return response.data.targets[0]?.id ?? '';
    });
    setIsLoadingTargets(false);
  }, []);

  useEffect(() => {
    void loadTargets();
  }, [loadTargets]);

  async function handleCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const targetApplicationId = String(formData.get('targetApplicationId') ?? selectedTargetId);

    if (!targetApplicationId) {
      setError('Pilih target lamaran terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    const response = await createSession({
      mode: String(formData.get('mode') ?? 'practice') as SessionMode,
      plannedQuestionCount: Number(formData.get('plannedQuestionCount') ?? 5),
      targetApplicationId,
    });

    if (response.error) {
      setError(humanizeApiError(response.error));
      setIsSubmitting(false);
      return;
    }

    router.push(`/interview?sessionId=${response.data.session.id}`);
  }

  return (
    <AppShell
      activeHref="/interview"
      description="Pilih konteks target, mode sesi, dan cek kesiapan mikrofon sebelum mulai."
      title="Interview Setup"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form className="space-y-5" onSubmit={handleCreateSession}>
          {error ? (
            <Card className="border-[#f4b8b8] bg-[#fff5f5] p-4 text-sm font-semibold text-[var(--danger)]">
              {error}
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
                  Pertanyaan akan disesuaikan dengan role, industri, skill, dan ringkasan pengalaman
                  dari target yang dipilih.
                </p>
              </div>
              <Button href="/targets?new=1" size="sm" variant="outline">
                Target Baru
              </Button>
            </div>

            <div className="mt-5 grid gap-3">
              {isLoadingTargets ? (
                [0, 1].map((item) => (
                  <div
                    className="h-32 animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-muted)]"
                    key={item}
                  />
                ))
              ) : targets.length > 0 ? (
                targets.map((target) => (
                  <TargetOption
                    isSelected={target.id === selectedTargetId}
                    key={target.id}
                    onSelect={setSelectedTargetId}
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
              dengan Gemini free tier dan model speech analytics lokal. Audio mentah tidak disimpan
              pada MVP.
            </p>
          </Card>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button href="/dashboard" type="button" variant="ghost">
              Kembali
            </Button>
            <Button disabled={targets.length === 0 || isSubmitting} isLoading={isSubmitting} type="submit">
              {isSubmitting ? 'Membuat session...' : 'Buat Session Interview'}
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
