'use client';

import { useEffect, useState } from 'react';
import type { AuthUser } from '@intervue/shared';
import { getMe } from '@/lib/api-client';

let cachedUser: AuthUser | null | undefined;
let inFlightUserRequest: Promise<{ unauthorized: boolean; user: AuthUser | null }> | null = null;

async function loadCurrentUser() {
  if (cachedUser !== undefined) {
    return { unauthorized: cachedUser === null, user: cachedUser };
  }

  inFlightUserRequest ??= getMe()
    .then((response) => {
      if (response.data) {
        cachedUser = response.data.user;
        return { unauthorized: false, user: cachedUser };
      }

      if (response.error?.code === 'UNAUTHORIZED') {
        cachedUser = null;
        return { unauthorized: true, user: null };
      }

      return { unauthorized: false, user: null };
    })
    .finally(() => {
      inFlightUserRequest = null;
    });

  return inFlightUserRequest;
}

export function clearCachedUser() {
  cachedUser = null;
}

export function cacheCurrentUser(user: AuthUser) {
  cachedUser = user;
}

export function useCurrentUser(initialUser: AuthUser | null = null) {
  const [user, setUser] = useState<AuthUser | null>(initialUser ?? cachedUser ?? null);
  const [isLoading, setIsLoading] = useState(cachedUser === undefined && !initialUser);

  useEffect(() => {
    let isMounted = true;

    if (initialUser && cachedUser === undefined) {
      cachedUser = initialUser;
    }

    loadCurrentUser()
      .then(({ unauthorized, user: nextUser }) => {
        if (!isMounted) {
          return;
        }

        setUser(nextUser);
        setIsLoading(false);

        if (unauthorized && window.location.pathname !== '/login') {
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        }
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { user, isLoading };
}
