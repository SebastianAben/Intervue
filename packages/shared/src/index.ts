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

export type TargetStatus = 'active' | 'archived';

export type JobLevel = 'intern' | 'fresh_graduate' | 'junior' | 'mid_level';

export type InterviewType = 'hr' | 'behavioral' | 'technical' | 'case' | 'mixed';

export type Language = 'id' | 'en';

export type TargetApplication = {
  id: string;
  role: string;
  company: string | null;
  industry: string;
  level: JobLevel;
  jobDescription: string | null;
  skillRequirements: string | null;
  interviewType: InterviewType;
  language: Language;
  candidateSummary: string | null;
  status: TargetStatus;
  createdAt: string;
  updatedAt: string;
};

export type TargetApplicationPayload = {
  role: string;
  company?: string | null;
  industry: string;
  level: JobLevel;
  jobDescription?: string | null;
  skillRequirements?: string | null;
  interviewType: InterviewType;
  language: Language;
  candidateSummary?: string | null;
};

export type TargetListResponse = ApiResponse<{
  targets: TargetApplication[];
}>;

export type TargetDetailResponse = ApiResponse<{
  target: TargetApplication;
}>;

export type SessionMode = 'practice' | 'full_simulation';

export type SessionStatus = 'setup' | 'active' | 'completed' | 'abandoned' | 'failed';

export type InterviewSession = {
  id: string;
  targetApplicationId: string;
  mode: SessionMode;
  status: SessionStatus;
  plannedQuestionCount: number;
  completedQuestionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateSessionPayload = {
  targetApplicationId: string;
  mode: SessionMode;
  plannedQuestionCount: number;
};

export type SessionDetailResponse = ApiResponse<{
  session: InterviewSession;
}>;
