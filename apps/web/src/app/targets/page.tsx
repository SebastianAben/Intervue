'use client';

import type {
  InterviewType,
  JobLevel,
  Language,
  TargetApplication,
  TargetApplicationPayload,
} from '@intervue/shared';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { archiveTarget, createTarget, listTargets, updateTarget } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { CvSummaryField } from './cv-summary-field';

const levelOptions = [
  { label: 'Internship', value: 'intern' },
  { label: 'Fresh graduate', value: 'fresh_graduate' },
  { label: 'Junior', value: 'junior' },
  { label: 'Mid level', value: 'mid_level' },
];

const languageOptions = [
  { label: 'Bahasa Indonesia', value: 'id' },
  { label: 'English', value: 'en' },
];

const fieldClassName =
  'h-[46px] w-full rounded-[var(--radius-sm)] border border-[var(--input-border)] bg-[var(--background)] px-[17px] text-base font-normal text-[var(--foreground)] transition-colors placeholder:text-[#6b7280] focus:border-[var(--primary-600)]';

function optionalText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim();
  return value.length > 0 ? value : null;
}

function payloadFromFormData(formData: FormData): TargetApplicationPayload {
  return {
    role: String(formData.get('role') ?? '').trim(),
    company: optionalText(formData, 'company'),
    industry: String(formData.get('industry') ?? '').trim(),
    level: String(formData.get('level') ?? 'fresh_graduate') as JobLevel,
    jobDescription: optionalText(formData, 'jobDescription'),
    skillRequirements: optionalText(formData, 'skillRequirements'),
    interviewType: String(formData.get('interviewType') ?? 'mixed') as InterviewType,
    language: String(formData.get('language') ?? 'id') as Language,
    candidateSummary: optionalText(formData, 'candidateSummary'),
    candidateCvText: optionalText(formData, 'candidateCvText'),
  };
}

function Field({
  children,
  className,
  helperText,
  label,
  optional = false,
  required = false,
}: {
  children: ReactNode;
  className?: string;
  helperText?: string;
  label: string;
  optional?: boolean;
  required?: boolean;
}) {
  return (
    <label className={cn('block', className)}>
      <span className="block text-xs font-semibold uppercase leading-3 tracking-[0.05em] text-[#404848]">
        {label} {required ? <span className="text-[var(--danger)]">*</span> : null}
        {optional ? <span className="font-normal text-[var(--muted)]">(Opsional)</span> : null}
      </span>
      {helperText ? (
        <span className="mt-1 block text-xs leading-4 text-[var(--muted)]">{helperText}</span>
      ) : null}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function Separator() {
  return <div className="h-px w-full bg-[#e5e5e5]" />;
}

function hasValue(value: string | null | undefined) {
  return Boolean(value?.trim());
}

function targetCompleteness(target: TargetApplication) {
  const fields = [
    hasValue(target.role),
    hasValue(target.company),
    hasValue(target.industry),
    hasValue(target.jobDescription),
    hasValue(target.skillRequirements),
    hasValue(target.candidateSummary),
  ];

  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function TargetForm({
  error,
  isSubmitting,
  mode = 'create',
  onSubmit,
  submitLabel,
  target,
}: {
  error?: string | null;
  isSubmitting: boolean;
  mode?: 'create' | 'edit';
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  submitLabel: string;
  target?: TargetApplication;
}) {
  return (
    <form
      className="overflow-hidden rounded-[12px] border border-[#e5e5e5] bg-white shadow-[0_1px_2px_rgb(0_0_0_/_0.05)]"
      onSubmit={onSubmit}
    >
      {target ? <input name="targetId" type="hidden" value={target.id} /> : null}
      <div className="h-1 bg-[var(--primary)]" />
      <div className="flex flex-col gap-6 px-[25px] pb-[25px] pt-[45px]">
        {error ? (
          <p className="rounded-[var(--radius-sm)] bg-[#fde8e8] px-4 py-3 text-sm font-semibold text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <Field className="md:col-span-2" label="Nama Posisi" required>
            <input
              className={fieldClassName}
              defaultValue={target?.role}
              name="role"
              placeholder="Contoh: Senior UX Researcher"
              required
            />
          </Field>
          <Field label="Nama Perusahaan" optional>
            <input
              className={fieldClassName}
              defaultValue={target?.company ?? ''}
              name="company"
              placeholder="Contoh: GoTo"
            />
          </Field>
          <Field label="Industri" required>
            <input
              className={fieldClassName}
              defaultValue={target?.industry}
              name="industry"
              placeholder="Pilih Industri"
              required
            />
          </Field>
          <input name="interviewType" type="hidden" value={target?.interviewType ?? 'mixed'} />
        </div>

        <Separator />

        <Field label="Level Pekerjaan" required>
          <div className="grid rounded-[var(--radius-sm)] bg-[var(--surface-muted)] p-1 sm:grid-cols-4">
            {levelOptions.map((option) => {
              const selected = (target?.level ?? 'junior') === option.value;
              return (
                <label
                  className="relative cursor-pointer rounded-[6px] text-center text-sm font-medium leading-5"
                  key={option.value}
                >
                  <input
                    className="peer sr-only"
                    defaultChecked={selected}
                    name="level"
                    type="radio"
                    value={option.value}
                  />
                  <span className="block rounded-[6px] px-4 py-2 text-[var(--muted)] transition-colors peer-checked:bg-white peer-checked:text-[var(--primary)] peer-checked:shadow-[0_1px_1px_rgb(0_0_0_/_0.05)]">
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
        </Field>

        <Field label="Bahasa Interview">
          <div className="grid gap-4 md:grid-cols-2">
            {languageOptions.map((option) => {
              const selected = (target?.language ?? 'id') === option.value;
              return (
                <label
                  className={cn(
                    'flex h-[60px] cursor-pointer items-center rounded-[var(--radius-sm)] border px-4 text-base font-medium leading-[25.6px] text-[var(--foreground)]',
                    selected
                      ? 'border-[var(--primary)] bg-[rgb(180_237_236_/_0.1)]'
                      : 'border-[var(--input-border)] bg-white',
                  )}
                  key={option.value}
                >
                  <input
                    className="mr-3 h-4 w-4 accent-[var(--primary)]"
                    defaultChecked={selected}
                    name="language"
                    type="radio"
                    value={option.value}
                  />
                  {option.label === 'Bahasa Indonesia' ? 'Indonesia' : 'Inggris'}
                </label>
              );
            })}
          </div>
        </Field>

        <Separator />

        <Field
          helperText="Salin & tempel deskripsi dari lowongan pekerjaan untuk konteks wawancara yang lebih akurat."
          label="Deskripsi Pekerjaan"
        >
          <textarea
            className={cn(fieldClassName, 'min-h-[124px] resize-y py-3 leading-[25.6px]')}
            defaultValue={target?.jobDescription ?? ''}
            name="jobDescription"
            placeholder="Tempel deskripsi pekerjaan di sini..."
          />
        </Field>

        <Field label="Kebutuhan Skill (Pisahkan dengan koma)">
          <input
            className={fieldClassName}
            defaultValue={target?.skillRequirements ?? ''}
            name="skillRequirements"
            placeholder="Contoh: Figma, User Research, Prototyping"
          />
        </Field>

        <CvSummaryField defaultCvText={target?.candidateCvText} defaultValue={target?.candidateSummary} />

        <div className="flex justify-end gap-4 border-t border-[#e5e5e5] pt-[17px]">
          <Button href="/targets" type="button" variant="ghost">
            Batal
          </Button>
          <Button className="px-8" isLoading={isSubmitting} type="submit">
            {submitLabel}
            {mode === 'create' ? (
              <span aria-hidden="true" className="ml-1.5">
                -&gt;
              </span>
            ) : null}
          </Button>
        </div>
      </div>
    </form>
  );
}

function TargetCard({
  isSubmitting,
  onArchive,
  onUpdate,
  target,
}: {
  isSubmitting: boolean;
  onArchive: (targetId: string) => void;
  onUpdate: (event: FormEvent<HTMLFormElement>, targetId: string) => void;
  target: TargetApplication;
}) {
  const completeness = targetCompleteness(target);

  return (
    <Card className="p-4 shadow-[0_2px_5px_rgb(0_0_0_/_0.02)]">
      <div className="flex flex-col gap-4">
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] bg-[rgb(180_237_236_/_0.2)] text-[var(--primary)]">
              <span aria-hidden="true" className="relative h-4 w-4">
                <span className="absolute left-1/2 top-0 h-4 w-0.5 -translate-x-1/2 rounded-full bg-current" />
                <span className="absolute left-0 top-1/2 h-0.5 w-4 -translate-y-1/2 rounded-full bg-current" />
              </span>
            </div>
            <Badge tone="success">Aktif</Badge>
          </div>
          <h2 className="mt-5 text-base font-bold leading-[25.6px] text-[var(--foreground)]">
            {target.role}
          </h2>
          <p className="mt-1 text-sm leading-[22.4px] text-[var(--muted)]">
            {[target.company, target.industry].filter(Boolean).join(' • ') || target.level}
          </p>
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-[var(--muted)]">
              <span>Kelengkapan target</span>
              <span className="text-[var(--foreground)]">{completeness}%</span>
            </div>
            <div
              aria-label={`Kelengkapan target ${completeness} persen`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={completeness}
              className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]"
              role="meter"
            >
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>
        </div>
        <Button
          className="w-full bg-[#edeeed] text-[var(--foreground)] hover:bg-[#e1e3e2]"
          href={`/interview?targetId=${target.id}`}
        >
          Latih Interview
        </Button>
      </div>

      <details className="mt-5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-muted)] p-4">
        <summary className="cursor-pointer text-sm font-bold text-[var(--foreground)]">
          Edit target
        </summary>
        <div className="mt-5">
          <TargetForm
            isSubmitting={isSubmitting}
            mode="edit"
            onSubmit={(event) => onUpdate(event, target.id)}
            submitLabel="Simpan perubahan"
            target={target}
          />
          <div className="mt-4">
            <Button
              isLoading={isSubmitting}
              onClick={() => onArchive(target.id)}
              size="sm"
              type="button"
              variant="danger"
            >
              Arsipkan
            </Button>
          </div>
        </div>
      </details>
    </Card>
  );
}

function EmptyTargets() {
  return (
    <Card className="p-6">
      <Badge tone="primary">Belum ada target</Badge>
      <h2 className="mt-5 font-[var(--font-jakarta)] text-2xl font-extrabold">
        Buat target lamaran pertama
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">
        Target aktif akan muncul di sini dan dipakai untuk membuat latihan interview lebih spesifik
        terhadap posisi yang kamu incar.
      </p>
    </Card>
  );
}

function TargetsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCreating = searchParams.get('new') === '1';
  const [targets, setTargets] = useState<TargetApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTargets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listTargets({ status: 'active' });
      if (response.error) {
        setError(response.error.message);
        setTargets([]);
        return;
      }

      setTargets(response.data.targets);
    } catch {
      setError('Target lamaran belum bisa dimuat.');
      setTargets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTargets();
  }, [loadTargets]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await createTarget(payloadFromFormData(new FormData(event.currentTarget)));
    setIsSubmitting(false);

    if (response.error) {
      setError(response.error.message);
      return;
    }

    router.push('/targets');
    await loadTargets();
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>, targetId: string) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await updateTarget(targetId, payloadFromFormData(new FormData(event.currentTarget)));
    setIsSubmitting(false);

    if (response.error) {
      setError(response.error.message);
      return;
    }

    await loadTargets();
  }

  async function handleArchive(targetId: string) {
    setIsSubmitting(true);
    setError(null);

    const response = await archiveTarget(targetId);
    setIsSubmitting(false);

    if (response.error) {
      setError(response.error.message);
      return;
    }

    setTargets((current) => current.filter((target) => target.id !== targetId));
  }

  if (isCreating) {
    return (
      <AppShell
        activeHref="/targets"
        mainClassName="min-h-full max-w-none bg-[#f9f8f6] px-6 py-6 lg:px-0 lg:py-6"
        showPageHeader={false}
        title="Buat Target Lamaran"
      >
        <div className="mx-auto flex w-full max-w-[800px] flex-col gap-6 pb-24">
          <div className="flex items-center">
            <Link
              aria-label="Kembali ke daftar target lamaran"
              className="grid h-8 w-8 place-items-center rounded-full text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
              href="/targets"
            >
              &larr;
            </Link>
            <div className="ml-4">
              <h1 className="font-[var(--font-jakarta)] text-2xl font-semibold leading-[33.6px] text-[var(--foreground)]">
                Buat Target Lamaran
              </h1>
              <p className="text-sm leading-5 text-[var(--muted)]">
                Isi detail posisi untuk menyesuaikan simulasi AI interviewer.
              </p>
            </div>
          </div>
          <TargetForm
            error={error}
            isSubmitting={isSubmitting}
            onSubmit={handleCreate}
            submitLabel="Simpan & Lanjut ke Interview"
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeHref="/targets"
      description="Kelola konteks posisi, industri, job description, skill, dan pengalaman untuk simulasi interview."
      title="Target Lamaran"
    >
      <div className="space-y-6">
        {error ? (
          <Card className="border-[#f4b8b8] bg-[#fff5f5] p-4 text-sm font-semibold text-[var(--danger)]">
            {error}
          </Card>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-[var(--font-jakarta)] text-xl font-normal leading-8 text-[var(--foreground)]">
              Target Lamaran Aktif
            </h2>
            <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
              Pilih target yang sudah dibuat atau tambah konteks lamaran baru.
            </p>
          </div>
          <Button href="/targets?new=1">Buat Target Lamaran</Button>
        </div>

        <section className="space-y-4 border-t border-[#e5e5e5] pt-4">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((item) => (
                <Card className="h-56 animate-pulse bg-white/60 p-4" key={item}>
                  <span className="sr-only">Memuat target</span>
                </Card>
              ))}
            </div>
          ) : targets.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {targets.map((target) => (
                <TargetCard
                  isSubmitting={isSubmitting}
                  key={target.id}
                  onArchive={handleArchive}
                  onUpdate={handleUpdate}
                  target={target}
                />
              ))}
            </div>
          ) : (
            <EmptyTargets />
          )}
        </section>
      </div>
    </AppShell>
  );
}

export default function TargetsPage() {
  return (
    <Suspense
      fallback={
        <AppShell
          activeHref="/targets"
          description="Kelola konteks lamaran yang dipakai untuk interview."
          title="Target Lamaran"
        >
          <Card className="h-56 animate-pulse bg-white/60 p-4">
            <span className="sr-only">Memuat target</span>
          </Card>
        </AppShell>
      }
    >
      <TargetsPageContent />
    </Suspense>
  );
}
