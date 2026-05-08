import { cn } from '@/lib/cn';

export type WaveformIndicatorProps = {
  active?: boolean;
  bars?: number;
  label?: string;
  className?: string;
};

export function WaveformIndicator({
  active = false,
  bars = 22,
  label = 'Indikator suara',
  className,
}: WaveformIndicatorProps) {
  return (
    <div aria-label={label} className={cn('flex h-12 items-center gap-1', className)} role="img">
      {Array.from({ length: bars }).map((_, index) => {
        const height = 18 + ((index * 11) % 28);

        return (
          <span
            aria-hidden="true"
            className={cn(
              'w-1.5 rounded-full bg-[var(--primary-600)] opacity-45',
              active && 'animate-pulse opacity-90',
            )}
            key={index}
            style={{
              height,
              animationDelay: `${index * 70}ms`,
            }}
          />
        );
      })}
    </div>
  );
}
