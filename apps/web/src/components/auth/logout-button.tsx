'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/api-client';

export type LogoutButtonProps = {
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'ghost' | 'outline';
};

export function LogoutButton({
  className,
  size = 'sm',
  variant = 'ghost',
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    await logout();
    router.push('/login');
    router.refresh();
  }

  return (
    <Button
      className={className}
      isLoading={isLoading}
      onClick={handleLogout}
      size={size}
      type="button"
      variant={variant}
    >
      Keluar
    </Button>
  );
}
