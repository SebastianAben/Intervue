import type { InterviewType, Language, QuestionType } from '@prisma/client';

type InitialQuestionInput = {
  role: string;
  company: string | null;
  industry: string;
  interviewType: InterviewType;
  language: Language;
};

const questionTypeByInterviewType: Record<InterviewType, QuestionType> = {
  behavioral: 'behavioral',
  case: 'case',
  hr: 'hr',
  mixed: 'behavioral',
  technical: 'technical',
};

export function buildInitialQuestion(input: InitialQuestionInput) {
  const companyContext = input.company ? ` di ${input.company}` : '';
  const englishCompanyContext = input.company ? ` at ${input.company}` : '';
  const questionText =
    input.language === 'en'
      ? `Tell me about your background and why it fits the ${input.role} role${englishCompanyContext} in the ${input.industry} industry.`
      : `Ceritakan latar belakang kamu dan mengapa pengalamanmu cocok untuk posisi ${input.role}${companyContext} di industri ${input.industry}.`;

  return {
    questionText,
    questionType: questionTypeByInterviewType[input.interviewType],
  };
}
