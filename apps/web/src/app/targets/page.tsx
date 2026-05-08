import type {
  InterviewType,
  JobLevel,
  Language,
  TargetApplication,
  TargetApplicationPayload,
} from '@intervue/shared';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { requireAuth } from '@/lib/auth-server';
import { archiveTarget, createTarget, listTargets, updateTarget } from '@/lib/api-client';

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
  };
}

async function createTargetAction(formData: FormData) {
  'use server';

  const cookieHeader = (await cookies()).toString();
  await createTarget(payloadFromFormData(formData), { cookie: cookieHeader });
  revalidatePath('/targets');
  revalidatePath('/dashboard');
  redirect('/targets');
}

async function updateTargetAction(formData: FormData) {
  'use server';

  const targetId = String(formData.get('targetId') ?? '');
  if (!targetId) {
    return;
  }

  const cookieHeader = (await cookies()).toString();
  await updateTarget(targetId, payloadFromFormData(formData), { cookie: cookieHeader });
  revalidatePath('/targets');
  revalidatePath('/dashboard');
}

async function archiveTargetAction(formData: FormData) {
  'use server';

  const targetId = String(formData.get('targetId') ?? '');
  if (!targetId) {
    return;
  }

  const cookieHeader = (await cookies()).toString();
  await archiveTarget(targetId, { cookie: cookieHeader });
  revalidatePath('/targets');
  revalidatePath('/dashboard');
}

function TargetForm({
  action,
  submitLabel,
  mode = 'create',
  target,
}: {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  mode?: 'create' | 'edit';
  target?: TargetApplication;
}) {
  return (
    <form
      action={action}
      className="overflow-hidden rounded-[12px] border border-[#e5e5e5] bg-white shadow-[0_1px_2px_rgb(0_0_0_/_0.05)]"
    >
      {target ? <input name="targetId" type="hidden" value={target.id} /> : null}
      <div className="h-1 bg-[var(--primary)]" />
      <div className="flex flex-col gap-6 px-[25px] pb-[25px] pt-[45px]">
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
                  <span className="block rounded-[6px] px-4 py-2 text-[var(--muted)] transition-colors peer-checked:bg-white peer-checked:text-[var(--primary)] peer-checked:shadow-[0_1px_1px_rgb(0_0_0_/_0.05)] peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[rgb(13_77_77_/_0.28)]">
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

        <Field label="CV / Ringkasan Pengalaman">
          <textarea
            className="min-h-[144px] w-full resize-y rounded-[12px] border-2 border-dashed border-[var(--input-border)] bg-[var(--background)] px-5 py-5 text-center text-sm font-medium text-[var(--foreground)] transition-colors placeholder:text-[var(--muted)] focus:border-[var(--primary-600)]"
            defaultValue={target?.candidateSummary ?? ''}
            name="candidateSummary"
            placeholder="Tulis ringkasan pengalaman, proyek, atau pencapaian yang relevan di sini."
          />
          <p className="mt-2 text-center text-xs leading-4 text-[var(--muted)]">
            AI akan membaca ringkasan ini untuk menyesuaikan pertanyaan seputar pengalaman masa
            lalu.
          </p>
        </Field>

        <div className="flex justify-end gap-4 border-t border-[#e5e5e5] pt-[17px]">
          <Button href="/targets" type="button" variant="ghost">
            Batal
          </Button>
          <Button className="px-8" type="submit">
            {submitLabel}
            {mode === 'create' ? <span aria-hidden="true">-&gt;</span> : null}
          </Button>
        </div>
      </div>
    </form>
  );
}

const fieldClassName =
  'h-[46px] w-full rounded-[var(--radius-sm)] border border-[var(--input-border)] bg-[var(--background)] px-[17px] text-base font-normal text-[var(--foreground)] transition-colors placeholder:text-[#6b7280] focus:border-[var(--primary-600)]';

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

function TargetCard({ target }: { target: TargetApplication }) {
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
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
            <div className="h-full w-[72%] rounded-full bg-[var(--primary)]" />
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
            action={updateTargetAction}
            mode="edit"
            submitLabel="Simpan perubahan"
            target={target}
          />
          <form action={archiveTargetAction} className="mt-4">
            <input name="targetId" type="hidden" value={target.id} />
            <Button size="sm" type="submit" variant="danger">
              Arsipkan
            </Button>
          </form>
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

export default async function TargetsPage({
  searchParams,
}: {
  searchParams?: Promise<{ new?: string }>;
}) {
  const user = await requireAuth();
  const cookieHeader = (await cookies()).toString();
  const response = await listTargets({ status: 'active', cookie: cookieHeader });
  const targets = response.data?.targets ?? [];
  const params = searchParams ? await searchParams : {};
  const isCreating = params.new === '1';

  if (isCreating) {
    return (
      <AppShell
        activeHref="/targets"
        mainClassName="min-h-full max-w-none bg-[#f9f8f6] px-6 py-6 lg:px-0 lg:py-6"
        showPageHeader={false}
        title="Buat Target Lamaran"
        user={user}
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
          <TargetForm action={createTargetAction} submitLabel="Simpan & Lanjut ke Interview" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeHref="/targets"
      description="Kelola konteks posisi, industri, job description, skill, dan pengalaman untuk simulasi interview."
      title="Target Lamaran"
      user={user}
    >
      <div className="space-y-6">
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
          {targets.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {targets.map((target) => (
                <TargetCard key={target.id} target={target} />
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
