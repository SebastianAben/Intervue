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
  candidateCvText: string | null;
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
  candidateCvText?: string | null;
};

export type TargetListResponse = ApiResponse<{
  targets: TargetApplication[];
}>;

export type TargetDetailResponse = ApiResponse<{
  target: TargetApplication;
}>;

export type ParseCvResponse = ApiResponse<{
  summary: string;
  parsedText: string;
  characterCount: number;
  truncated: boolean;
  summaryGenerated: boolean;
}>;

export type SessionMode = 'practice' | 'full_simulation';

export type SessionStatus = 'setup' | 'active' | 'completed' | 'abandoned' | 'failed';

export type QuestionType = 'hr' | 'behavioral' | 'technical' | 'case' | 'follow_up';

export type SpeechRecognitionSource = 'web_speech_api' | 'manual';

export type TranscriptCorrection = {
  from: string;
  to: string;
  confidence: number;
  source: 'company' | 'role' | 'industry' | 'job_description' | 'skills' | 'candidate' | 'generic';
};

export type TranscriptCorrectionResult = {
  rawTranscript: string;
  correctedTranscript: string;
  corrections: TranscriptCorrection[];
  changeRatio: number;
};

export type SpeechPredictionOutput = {
  deliveryQuality: number | null;
  fluencyScore: number | null;
  confidenceSignal: number | null;
  speechPredictionLabel: string | null;
  speechPredictionModelName: string | null;
  speechPredictionModelVersion: string | null;
};

export type NonverbalFeatures = {
  face_detected_ratio: number;
  head_yaw_mean: number;
  head_yaw_std: number;
  head_pitch_mean: number;
  head_pitch_std: number;
  head_roll_mean: number;
  head_roll_std: number;
  mouth_movement_mean: number;
  mouth_movement_std: number;
  shoulder_movement_mean: number;
  shoulder_movement_std: number;
  hand_movement_mean: number;
  hand_movement_std: number;
  frame_count: number;
  analyzed_duration_seconds: number;
};

export type NonverbalPredictionOutput = {
  nonverbalScore: number | null;
  nonverbalModelName: string | null;
  nonverbalModelVersion: string | null;
  nonverbalFeatures: NonverbalFeatures | null;
  nonverbalSource: string | null;
  nonverbalError: string | null;
};

export type DimensionScores = {
  relevance: number;
  structure: number;
  depth: number;
  impact: number;
  verbalCommunication: number;
  professionalism: number;
  confidenceSignal: number;
};

export type AnswerEvaluation = {
  id: string;
  turnId: string;
  answerScore: number;
  dimensionScores: DimensionScores;
  speechMetrics: Record<string, unknown>;
  nonverbalMetrics: Record<string, unknown> | null;
  strengths: string[];
  improvements: string[];
  betterAnswerExample: string;
  followUpQuestion: string | null;
  createdAt: string;
};

export type InterviewTurn = SpeechPredictionOutput &
  NonverbalPredictionOutput & {
    id: string;
    sessionId: string;
    turnIndex: number;
    questionText: string;
    questionType: QuestionType;
    answerTranscript: string | null;
    rawTranscript: string | null;
    transcriptCorrections: TranscriptCorrection[];
    durationSeconds: number | null;
    speechRecognitionSource: SpeechRecognitionSource | null;
    speechRecognitionLanguage: string | null;
    speechRecognitionRetryCount: number;
    browserUserAgent: string | null;
    evaluation: AnswerEvaluation | null;
    createdAt: string;
    updatedAt: string;
  };

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

export type InterviewSessionDetail = InterviewSession & {
  targetApplication: TargetApplication;
  turns: InterviewTurn[];
};

export type CreateSessionPayload = {
  targetApplicationId: string;
  mode: SessionMode;
  plannedQuestionCount: number;
};

export type CreateSessionResponse = ApiResponse<{
  session: InterviewSession;
}>;

export type SessionDetailResponse = ApiResponse<{
  session: InterviewSessionDetail;
}>;

export type SubmitAnswerPayload = {
  answerTranscript: string;
  rawTranscript?: string | null;
  transcriptCorrections?: TranscriptCorrection[];
  durationSeconds: number;
  speechRecognitionSource: SpeechRecognitionSource;
  speechRecognitionLanguage?: string | null;
  speechRecognitionRetryCount: number;
  browserUserAgent?: string | null;
  nonverbalFeatures?: NonverbalFeatures | null;
};

type CorrectionSource = TranscriptCorrection['source'];

type DictionaryEntry = {
  term: string;
  aliases: string[];
  source: CorrectionSource;
};

const commonAcronyms = new Set([
  'AI',
  'API',
  'BI',
  'B2B',
  'B2C',
  'CI',
  'CD',
  'CRM',
  'CSS',
  'CV',
  'DB',
  'ETL',
  'GCP',
  'HR',
  'HTML',
  'HTTP',
  'HTTPS',
  'JSON',
  'KPI',
  'LLM',
  'ML',
  'MVP',
  'NLP',
  'OKR',
  'PDF',
  'QA',
  'RAG',
  'REST',
  'ROI',
  'SDK',
  'SEO',
  'SQL',
  'UI',
  'UX',
]);

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map(normalizeWhitespace).filter(Boolean)));
}

function splitCamelCase(value: string) {
  return value.replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

function stripOuterPunctuation(value: string) {
  return value.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
}

function sourceTexts(target: TargetApplication) {
  return [
    { source: 'company' as const, text: target.company ?? '' },
    { source: 'role' as const, text: target.role },
    { source: 'industry' as const, text: target.industry },
    { source: 'job_description' as const, text: target.jobDescription ?? '' },
    { source: 'skills' as const, text: target.skillRequirements ?? '' },
    {
      source: 'candidate' as const,
      text: [target.candidateSummary, target.candidateCvText].filter(Boolean).join(' '),
    },
  ];
}

function extractAcronyms(text: string) {
  return text.match(/\b[A-Z][A-Z0-9+#.]{1,}\b/g) ?? [];
}

function extractTechnicalTerms(text: string) {
  return text.match(/\b[\p{L}\p{N}]+(?:[-/.+][\p{L}\p{N}]+)+\b/gu) ?? [];
}

function extractProperPhrases(text: string) {
  const matches = text.match(/\b(?:[A-Z][\p{L}\p{N}+#.]*(?:\s+[A-Z][\p{L}\p{N}+#.]*){0,3})\b/gu);

  return (matches ?? []).filter((match) => match.length >= 3);
}

function extractListPhrases(text: string) {
  return text
    .split(/[,;\n|]+/)
    .map(stripOuterPunctuation)
    .filter((phrase) => {
      const words = phrase.split(/\s+/).filter(Boolean);
      return words.length >= 2 && words.length <= 4 && phrase.length <= 80;
    });
}

function buildAliases(term: string) {
  const aliases = [
    term.toLowerCase(),
    splitCamelCase(term).toLowerCase(),
    term.replace(/[-/.+]+/g, ' ').toLowerCase(),
    term.replace(/[-/.+\s]+/g, '').toLowerCase(),
  ];

  if (/^[A-Z0-9+#.]{2,}$/.test(term)) {
    aliases.push(term.toLowerCase().split('').join(' '));
  }

  return uniqueValues(aliases).filter((alias) => alias !== term);
}

export function buildTranscriptCorrectionDictionary(target: TargetApplication) {
  const entries = new Map<string, DictionaryEntry>();

  for (const { source, text } of sourceTexts(target)) {
    const terms = uniqueValues([
      ...extractAcronyms(text),
      ...extractTechnicalTerms(text),
      ...extractProperPhrases(text),
      ...extractListPhrases(text),
      ...(source === 'company' || source === 'role' || source === 'industry' ? [text] : []),
    ])
      .map(stripOuterPunctuation)
      .filter((term) => term.length >= 2 && term.length <= 80);

    for (const term of terms) {
      const key = term.toLowerCase();
      if (!entries.has(key)) {
        entries.set(key, {
          aliases: buildAliases(term),
          source,
          term,
        });
      }
    }
  }

  for (const acronym of commonAcronyms) {
    const appearsInContext = sourceTexts(target).some(({ text }) =>
      new RegExp(`\\b${acronym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text),
    );

    if (appearsInContext && !entries.has(acronym.toLowerCase())) {
      entries.set(acronym.toLowerCase(), {
        aliases: buildAliases(acronym),
        source: 'generic',
        term: acronym,
      });
    }
  }

  return Array.from(entries.values()).filter((entry) => entry.aliases.length > 0);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function aliasPattern(alias: string) {
  return new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(alias)})(?=$|[^\\p{L}\\p{N}])`, 'giu');
}

function tokenDifferenceRatio(rawTranscript: string, correctedTranscript: string) {
  const rawTokens = rawTranscript.trim().split(/\s+/).filter(Boolean);
  const correctedTokens = correctedTranscript.trim().split(/\s+/).filter(Boolean);
  const maxLength = Math.max(rawTokens.length, correctedTokens.length, 1);
  let differences = Math.abs(rawTokens.length - correctedTokens.length);

  for (let index = 0; index < Math.min(rawTokens.length, correctedTokens.length); index += 1) {
    if (rawTokens[index] !== correctedTokens[index]) {
      differences += 1;
    }
  }

  return differences / maxLength;
}

export function applyTranscriptCorrections(
  rawTranscript: string,
  target: TargetApplication,
): TranscriptCorrectionResult {
  let correctedTranscript = normalizeWhitespace(rawTranscript);
  const corrections: TranscriptCorrection[] = [];
  const dictionary = buildTranscriptCorrectionDictionary(target).sort(
    (a, b) => b.term.length - a.term.length,
  );

  for (const entry of dictionary) {
    for (const alias of entry.aliases.sort((a, b) => b.length - a.length)) {
      const pattern = aliasPattern(alias);
      correctedTranscript = correctedTranscript.replace(pattern, (match, prefix, found) => {
        if (found === entry.term) {
          return match;
        }

        corrections.push({
          confidence: 0.86,
          from: found,
          source: entry.source,
          to: entry.term,
        });
        return `${prefix}${entry.term}`;
      });
    }
  }

  const normalizedRawTranscript = normalizeWhitespace(rawTranscript);
  const uniqueCorrections = corrections.filter(
    (correction, index, list) =>
      list.findIndex(
        (item) =>
          item.from.toLowerCase() === correction.from.toLowerCase() &&
          item.to === correction.to &&
          item.source === correction.source,
      ) === index,
  );

  return {
    changeRatio: tokenDifferenceRatio(normalizedRawTranscript, correctedTranscript),
    correctedTranscript,
    corrections: uniqueCorrections,
    rawTranscript: normalizedRawTranscript,
  };
}

export function shouldReviewTranscriptCorrection(result: TranscriptCorrectionResult) {
  const wordCount = result.correctedTranscript.split(/\s+/).filter(Boolean).length;
  return (
    result.changeRatio >= 0.18 ||
    result.corrections.length >= 5 ||
    (wordCount < 12 && result.corrections.length > 0)
  );
}

export type SubmitAnswerResponse = ApiResponse<{
  session: InterviewSessionDetail;
  turn: InterviewTurn;
}>;

export type SessionReportTurnSummary = {
  turnId: string;
  turnIndex: number;
  questionText: string;
  questionType: QuestionType;
  answerTranscript: string;
  durationSeconds: number | null;
  answerScore: number;
  dimensionScores: DimensionScores;
  deliveryQuality: number | null;
  fluencyScore: number | null;
  confidenceSignal: number | null;
  speechPredictionLabel: string | null;
  nonverbalScore: number | null;
  strengths: string[];
  improvements: string[];
  betterAnswerExample: string;
  followUpQuestion: string | null;
};

export type SpeechSummary = {
  deliveryQuality: number | null;
  fluencyScore: number | null;
  confidenceSignal: number | null;
  labelDistribution: Record<string, number>;
};

export type SessionReport = {
  id: string;
  sessionId: string;
  overallScore: number;
  dimensionSummary: DimensionScores;
  speechSummary: SpeechSummary;
  strengths: string[];
  improvementPriorities: string[];
  recommendations: string[];
  turns: SessionReportTurnSummary[];
  createdAt: string;
};

export type ReportDetailResponse = ApiResponse<{
  session: InterviewSessionDetail;
  report: SessionReport;
}>;

export type HistorySessionSummary = {
  id: string;
  targetApplicationId: string;
  targetRole: string;
  targetCompany: string | null;
  targetIndustry: string;
  mode: SessionMode;
  status: SessionStatus;
  plannedQuestionCount: number;
  completedQuestionCount: number;
  overallScore: number | null;
  hasReport: boolean;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HistoryListResponse = ApiResponse<{
  sessions: HistorySessionSummary[];
}>;
