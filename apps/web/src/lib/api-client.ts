import type {
  ApiResponse,
  AuthResponse,
  CreateSessionPayload,
  SessionDetailResponse,
  TargetApplicationPayload,
  TargetDetailResponse,
  TargetListResponse,
  TargetStatus,
} from '@intervue/shared';

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';
type AuthPayload = NonNullable<AuthResponse['data']>;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  cookie?: string;
};

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, cookie }: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    credentials: 'include',
  });

  return (await response.json()) as ApiResponse<T>;
}

export async function login(payload: { email: string; password: string }) {
  return apiRequest<AuthPayload>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export async function register(payload: {
  name: string;
  email: string;
  password: string;
  status: 'student' | 'fresh_graduate' | 'job_seeker' | 'other';
  defaultLanguage: 'id' | 'en';
}) {
  return apiRequest<AuthPayload>('/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export async function logout() {
  return apiRequest<{ loggedOut: boolean }>('/auth/logout', {
    method: 'POST',
  });
}

export async function listTargets({
  status = 'active',
  cookie,
}: {
  status?: TargetStatus;
  cookie?: string;
} = {}) {
  const params = new URLSearchParams({ status });
  return apiRequest<NonNullable<TargetListResponse['data']>>(`/targets?${params.toString()}`, {
    cookie,
  });
}

export async function getTarget(targetId: string, { cookie }: { cookie?: string } = {}) {
  return apiRequest<NonNullable<TargetDetailResponse['data']>>(`/targets/${targetId}`, {
    cookie,
  });
}

export async function createTarget(
  payload: TargetApplicationPayload,
  { cookie }: { cookie?: string } = {},
) {
  return apiRequest<NonNullable<TargetDetailResponse['data']>>('/targets', {
    method: 'POST',
    body: payload,
    cookie,
  });
}

export async function updateTarget(
  targetId: string,
  payload: TargetApplicationPayload,
  { cookie }: { cookie?: string } = {},
) {
  return apiRequest<NonNullable<TargetDetailResponse['data']>>(`/targets/${targetId}`, {
    method: 'PATCH',
    body: payload,
    cookie,
  });
}

export async function archiveTarget(targetId: string, { cookie }: { cookie?: string } = {}) {
  return apiRequest<NonNullable<TargetDetailResponse['data']>>(`/targets/${targetId}`, {
    method: 'DELETE',
    cookie,
  });
}

export async function createSession(
  payload: CreateSessionPayload,
  { cookie }: { cookie?: string } = {},
) {
  return apiRequest<NonNullable<SessionDetailResponse['data']>>('/sessions', {
    method: 'POST',
    body: payload,
    cookie,
  });
}
