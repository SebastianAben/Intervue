import type { AuthResponse, AuthUser } from '@intervue/shared';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieHeader = (await cookies()).toString();

  if (!cookieHeader.includes('intervue_session=')) {
    return null;
  }

  try {
    const response = await apiRequest<NonNullable<AuthResponse['data']>>('/auth/me', {
      cookie: cookieHeader,
    });

    return response.data?.user ?? null;
  } catch {
    return null;
  }
}

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}
