import { cn } from '@/lib/cn';

export type VoiceStatus =
  | 'ready'
  | 'ai-speaking'
  | 'recording'
  | 'transcribing'
  | 'analyzing'
  | 'error';

const config: Record<VoiceStatus, { label: string; className: string; dot: string }> = {
  ready: {
    label: 'Siap',
    className: 'bg-[var(--surface-muted)] text-[var(--muted)]',
    dot: 'bg-[var(--muted)]',
  },
  'ai-speaking': {
    label: 'AI berbicara',
    className: 'bg-[#d7ece8] text-[var(--primary)]',
    dot: 'bg-[var(--primary-600)]',
  },
  recording: {
    label: 'Merekam',
    className: 'bg-[#fde8e8] text-[var(--danger)]',
    dot: 'bg-[var(--danger)]',
  },
  transcribing: {
    label: 'Transkripsi',
    className: 'bg-[#fff4d8] text-[var(--warning)]',
    dot: 'bg-[var(--warning)]',
  },
  analyzing: {
    label: 'Analisis',
    className: 'bg-[#d7ece8] text-[var(--primary)]',
    dot: 'bg-[var(--primary-600)]',
  },
  error: {
    label: 'Error',
    className: 'bg-[#fde8e8] text-[var(--danger)]',
    dot: 'bg-[var(--danger)]',
  },
};

export type StatusChipProps = {
  status: VoiceStatus;
  className?: string;
};

export function StatusChip({ status, className }: StatusChipProps) {
  const item = config[status];

  return (
    <span
      className={cn(
        'inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs font-bold',
        item.className,
        className,
      )}
    >
      <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', item.dot)} />
      {item.label}
    </span>
  );
}
