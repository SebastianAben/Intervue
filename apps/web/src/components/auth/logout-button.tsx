'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { logout } from '@/lib/api-client';
import { clearCachedUser } from '@/lib/use-current-user';

export type LogoutButtonProps = {
  className?: string;
  size?: 'sm' | 'md';
  unstyled?: boolean;
  variant?: 'ghost' | 'outline';
};

export function LogoutButton({
  className,
  size = 'sm',
  unstyled = false,
  variant = 'ghost',
}: LogoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    await logout();
    clearCachedUser();
    router.push('/login');
    router.refresh();
  }

  if (unstyled) {
    return (
      <button className={className} disabled={isLoading} onClick={handleLogout} type="button">
        Keluar
      </button>
    );
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
