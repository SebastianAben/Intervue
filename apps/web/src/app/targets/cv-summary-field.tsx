'use client';

import type { ChangeEvent } from 'react';
import { useId, useRef, useState } from 'react';
import { parseCv } from '@/lib/api-client';
import { cn } from '@/lib/cn';

type UploadState =
  | { status: 'idle'; message: string | null }
  | { status: 'loading'; message: string }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

export function CvSummaryField({
  defaultCvText = '',
  defaultValue = '',
}: {
  defaultCvText?: string | null;
  defaultValue?: string | null;
}) {
  const [summary, setSummary] = useState(defaultValue ?? '');
  const [cvText, setCvText] = useState(defaultCvText ?? '');
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    message: null,
  });
  const textareaId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isLoading = uploadState.status === 'loading';

  async function handleCvChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      setUploadState({ status: 'idle', message: null });
      return;
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setUploadState({
        status: 'error',
        message: 'Pilih file PDF agar CV bisa diproses.',
      });
      return;
    }

    const formData = new FormData();
    formData.append('cv', file);
    setUploadState({ status: 'loading', message: 'Membaca dan merangkum CV...' });

    try {
      const result = await parseCv(formData);

      if (result.error) {
        setUploadState({
          status: 'error',
          message: result.error?.message ?? 'CV gagal diproses. Coba unggah ulang.',
        });
        return;
      }

      setSummary(result.data.summary);
      setCvText(result.data.parsedText);
      setUploadState({
        status: 'success',
        message: result.data.summaryGenerated
          ? result.data.truncated
            ? `CV berhasil diringkas dengan AI (${result.data.characterCount} karakter, dipotong agar ringkas).`
            : `CV berhasil diringkas dengan AI (${result.data.characterCount} karakter).`
          : 'CV berhasil dibaca, tetapi ringkasan AI belum tersedia. Teks parsing dimasukkan sebagai fallback.',
      });
    } catch {
      setUploadState({
        status: 'error',
        message: 'CV gagal diproses. Periksa koneksi dan coba lagi.',
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <section className="block">
      <label
        className="block text-xs font-semibold uppercase leading-3 tracking-[0.05em] text-[#404848]"
        htmlFor={textareaId}
      >
        CV / Ringkasan Pengalaman
      </label>
      <div className="mt-2 rounded-[12px] border-2 border-dashed border-[var(--input-border)] bg-[var(--background)] p-4 transition-colors focus-within:border-[var(--primary-600)]">
        <textarea
          className="min-h-[144px] w-full resize-y bg-transparent px-1 py-1 text-left text-sm font-medium leading-[22.4px] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
          id={textareaId}
          name="candidateSummary"
          onChange={(event) => setSummary(event.target.value)}
          placeholder="Tulis ringkasan pengalaman, proyek, atau pencapaian yang relevan di sini."
          value={summary}
        />
        <input name="candidateCvText" type="hidden" value={cvText} />
        <div className="mt-4 flex flex-col gap-3 border-t border-[#e5e5e5] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              className={cn(
                'inline-flex h-10 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] border border-[var(--input-border)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]',
                isLoading && 'pointer-events-none opacity-55',
              )}
              disabled={isLoading}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              {isLoading ? 'Memproses...' : 'Unggah CV PDF'}
            </button>
            <input
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={isLoading}
              onChange={handleCvChange}
              ref={fileInputRef}
              type="file"
            />
          </div>
          {uploadState.message ? (
            <p
              aria-live="polite"
              className={cn(
                'text-sm leading-5',
                uploadState.status === 'error'
                  ? 'text-[var(--danger)]'
                  : uploadState.status === 'success'
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--muted)]',
              )}
            >
              {uploadState.message}
            </p>
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-center text-xs leading-4 text-[var(--muted)]">
        AI akan membaca ringkasan dan konteks CV untuk menyesuaikan pertanyaan seputar pengalaman masa lalu.
      </p>
    </section>
  );
}
