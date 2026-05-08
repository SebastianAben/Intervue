import { cn } from '@/lib/cn';

export type ScoreMeterProps = {
  value: number;
  label?: string;
  className?: string;
};

export function ScoreMeter({ value, label = 'Skor', className }: ScoreMeterProps) {
  const normalized = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      <div className="mb-2 flex items-center justify-between gap-4 text-sm">
        <span className="font-semibold text-[var(--muted)]">{label}</span>
        <span className="font-bold text-[var(--foreground)]">{normalized}/100</span>
      </div>
      <div
        aria-label={`${label} ${normalized} dari 100`}
        className="h-3 overflow-hidden rounded-full bg-[var(--surface-muted)]"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={normalized}
      >
        <div
          className="h-full rounded-full bg-[var(--primary-600)]"
          style={{ width: `${normalized}%` }}
        />
      </div>
    </div>
  );
}
