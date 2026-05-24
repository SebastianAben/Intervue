'use client';

import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

export function SubmitSessionButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled || pending} isLoading={pending} type="submit">
      {pending ? 'Membuat session...' : 'Buat Session Interview'}
    </Button>
  );
}
