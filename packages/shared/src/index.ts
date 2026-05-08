export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'TARGET_NOT_FOUND'
  | 'SESSION_NOT_FOUND'
  | 'AI_EVALUATION_FAILED'
  | 'GEMINI_RATE_LIMITED'
  | 'BACKEND_UNAVAILABLE'
  | 'REPORT_GENERATION_FAILED';

export type ApiResponse<T> =
  | {
      data: T;
      error: null;
    }
  | {
      data: null;
      error: {
        code: ApiErrorCode;
        message: string;
      };
    };

export type HealthResponse = ApiResponse<{
  status: 'ok';
}>;

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  status: 'student' | 'fresh_graduate' | 'job_seeker' | 'other';
  defaultLanguage: 'id' | 'en';
};

export type AuthResponse = ApiResponse<{
  user: AuthUser;
}>;
