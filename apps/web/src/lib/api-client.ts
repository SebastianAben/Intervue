import type {
  ApiErrorCode,
  ApiResponse,
  AuthResponse,
  CreateSessionResponse,
  CreateSessionPayload,
  DeleteAccountResponse,
  HistoryListResponse,
  ParseCvResponse,
  ReportDetailResponse,
  SessionDetailResponse,
  SubmitAnswerPayload,
  SubmitAnswerResponse,
  TargetApplicationPayload,
  TargetDetailResponse,
  TargetListResponse,
  TargetStatus,
  UpdateAccountPayload,
} from '@intervue/shared';

const browserApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api/backend';
const serverApiBaseUrl =
  process.env.API_INTERNAL_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api';

export const apiBaseUrl = typeof window === 'undefined' ? serverApiBaseUrl : browserApiBaseUrl;
type AuthPayload = NonNullable<AuthResponse['data']>;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  cookie?: string;
};

type ApiErrorPayload = {
  code: ApiErrorCode;
  message: string;
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

export async function deleteAccount(payload: { password: string }) {
  return apiRequest<NonNullable<DeleteAccountResponse['data']>>('/auth/account', {
    method: 'DELETE',
    body: payload,
  });
}

export async function getMe() {
  return apiRequest<AuthPayload>('/auth/me');
}

export async function updateAccount(payload: UpdateAccountPayload) {
  return apiRequest<AuthPayload>('/auth/me', {
    method: 'PATCH',
    body: payload,
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

export async function parseCv(formData: FormData) {
  const response = await fetch(`${apiBaseUrl}/targets/parse-cv`, {
    method: 'POST',
    body: formData,
    cache: 'no-store',
    credentials: 'include',
  });

  return (await response.json()) as ParseCvResponse;
}

export async function createSession(
  payload: CreateSessionPayload,
  { cookie }: { cookie?: string } = {},
) {
  return apiRequest<NonNullable<CreateSessionResponse['data']>>('/sessions', {
    method: 'POST',
    body: payload,
    cookie,
  });
}

export async function getSession(sessionId: string, { cookie }: { cookie?: string } = {}) {
  return apiRequest<NonNullable<SessionDetailResponse['data']>>(`/sessions/${sessionId}`, {
    cookie,
  });
}

export async function getReport(sessionId: string, { cookie }: { cookie?: string } = {}) {
  return apiRequest<NonNullable<ReportDetailResponse['data']>>(`/reports/${sessionId}`, {
    cookie,
  });
}

export async function listHistory({
  cookie,
  targetApplicationId,
}: {
  cookie?: string;
  targetApplicationId?: string;
} = {}) {
  const params = new URLSearchParams();

  if (targetApplicationId) {
    params.set('targetApplicationId', targetApplicationId);
  }

  const queryString = params.toString();

  return apiRequest<NonNullable<HistoryListResponse['data']>>(`/history${queryString ? `?${queryString}` : ''}`, {
    cookie,
  });
}

export async function startSession(sessionId: string, { cookie }: { cookie?: string } = {}) {
  return apiRequest<NonNullable<SessionDetailResponse['data']>>(`/sessions/${sessionId}/start`, {
    method: 'POST',
    cookie,
  });
}

export async function submitTurnAnswer(
  sessionId: string,
  turnId: string,
  payload: SubmitAnswerPayload,
) {
  return apiRequest<NonNullable<SubmitAnswerResponse['data']>>(
    `/sessions/${sessionId}/turns/${turnId}/answer`,
    {
      method: 'POST',
      body: payload,
    },
  );
}

export function humanizeApiError(error: ApiErrorPayload | null | undefined) {
  if (!error) {
    return 'Terjadi kendala jaringan. Coba ulangi setelah koneksi stabil.';
  }

  const messages: Partial<Record<ApiErrorCode, string>> = {
    AI_EVALUATION_FAILED:
      'Gemini belum bisa memproses jawaban saat ini. Transcript tetap aman di halaman ini; coba submit ulang beberapa saat lagi.',
    BACKEND_UNAVAILABLE:
      'Backend belum tersedia. Pastikan API home server berjalan lalu coba ulangi.',
    GEMINI_RATE_LIMITED:
      'Kuota Gemini free tier sedang penuh. Tunggu beberapa saat, lalu coba lagi tanpa membuat sesi baru.',
    REPORT_GENERATION_FAILED:
      'Report belum bisa dibuat dari data sesi ini. Coba buka ulang report setelah beberapa saat.',
    SESSION_NOT_FOUND:
      'Sesi interview tidak ditemukan atau tidak lagi tersedia untuk akun ini.',
    UNAUTHORIZED: 'Session login berakhir. Login ulang untuk melanjutkan.',
    VALIDATION_ERROR:
      'Input belum valid. Periksa transcript, durasi, dan status sesi sebelum mencoba lagi.',
  };

  return messages[error.code] ?? error.message;
}
