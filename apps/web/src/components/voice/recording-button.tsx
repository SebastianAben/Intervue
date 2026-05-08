import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type RecordingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isRecording?: boolean;
  label?: string;
};

export function RecordingButton({
  isRecording = false,
  label = isRecording ? 'Hentikan rekaman' : 'Mulai rekaman',
  className,
  ...props
}: RecordingButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        'grid h-16 w-16 place-items-center rounded-full border-4 border-white bg-[var(--primary-600)] text-white shadow-[var(--shadow-shell)] transition-transform hover:scale-[1.03] disabled:pointer-events-none disabled:opacity-55',
        isRecording && 'bg-[var(--danger)]',
        className,
      )}
      type="button"
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn('h-5 w-5 rounded-full bg-current', isRecording && 'h-5 w-5 rounded-[4px]')}
      />
    </button>
  );
}
