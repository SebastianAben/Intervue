import assert from 'node:assert/strict';
import test from 'node:test';
import {
  answerEvaluationSchema,
  classifyGeminiHttpError,
  GeminiInterviewError,
  interviewQuestionSchema,
  parseGeminiJson,
} from './gemini-interview.js';

test('parseGeminiJson parses a valid interview question response', () => {
  const question = parseGeminiJson(
    JSON.stringify({
      questionText: 'Ceritakan pengalaman paling relevan untuk posisi ini.',
      questionType: 'behavioral',
    }),
    interviewQuestionSchema,
  );

  assert.equal(question.questionType, 'behavioral');
  assert.match(question.questionText, /pengalaman/);
});

test('parseGeminiJson parses a valid answer evaluation response', () => {
  const evaluation = parseGeminiJson(
    JSON.stringify({
      answerScore: 78,
      dimensionScores: {
        relevance: 80,
        structure: 75,
        depth: 70,
        impact: 65,
        verbalCommunication: 82,
        professionalism: 85,
        confidenceSignal: 76,
      },
      strengths: ['Jawaban sudah relevan dengan pertanyaan.'],
      improvements: ['Tambahkan hasil terukur agar kontribusi lebih jelas.'],
      betterAnswerExample:
        'Pada proyek dashboard penjualan, saya bertanggung jawab mengolah data dan menyajikan insight yang membantu tim mengambil keputusan.',
      followUpQuestion: 'Metrik apa yang kamu gunakan untuk mengukur keberhasilan proyek tersebut?',
    }),
    answerEvaluationSchema,
  );

  assert.equal(evaluation.answerScore, 78);
  assert.equal(evaluation.dimensionScores.professionalism, 85);
});

test('parseGeminiJson maps malformed JSON to AI_EVALUATION_FAILED', () => {
  assert.throws(
    () => parseGeminiJson('not-json', interviewQuestionSchema),
    (error) => error instanceof GeminiInterviewError && error.code === 'AI_EVALUATION_FAILED',
  );
});

test('classifyGeminiHttpError maps rate limits to GEMINI_RATE_LIMITED', () => {
  const error = classifyGeminiHttpError(429, 'quota exceeded');

  assert.equal(error.code, 'GEMINI_RATE_LIMITED');
});

test('classifyGeminiHttpError maps high-demand outages to actionable AI failure', () => {
  const error = classifyGeminiHttpError(
    503,
    'This model is currently experiencing high demand. status: UNAVAILABLE',
  );

  assert.equal(error.code, 'AI_EVALUATION_FAILED');
  assert.match(error.message, /high demand/i);
});

test('classifyGeminiHttpError maps missing model to model configuration failure', () => {
  const error = classifyGeminiHttpError(404, 'models/gemini-x is not found');

  assert.equal(error.code, 'AI_EVALUATION_FAILED');
  assert.match(error.message, /GEMINI_MODEL/);
});
