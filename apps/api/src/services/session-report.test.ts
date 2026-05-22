import assert from 'node:assert/strict';
import test from 'node:test';
import { generateSessionReportFromTurns, ReportGenerationError } from './session-report.js';

const dimensionScores = {
  relevance: 80,
  structure: 70,
  depth: 60,
  impact: 65,
  verbalCommunication: 75,
  professionalism: 85,
  confidenceSignal: 72,
};

test('generateSessionReportFromTurns summarizes completed evaluated turns', () => {
  const report = generateSessionReportFromTurns([
    {
      id: 'turn-1',
      turnIndex: 1,
      questionText: 'Ceritakan proyek data terbaik Anda.',
      questionType: 'behavioral',
      answerTranscript: 'Saya membuat model fraud classifier dan meningkatkan F1 score.',
      durationSeconds: 50,
      deliveryQuality: 70,
      fluencyScore: 68,
      confidenceSignal: 73,
      speechPredictionLabel: 'developing',
      nonverbalScore: 64,
      evaluation: {
        answerScore: 74,
        dimensionScores,
        strengths: ['Relevan dengan target posisi.'],
        improvements: ['Tambahkan metrik bisnis yang lebih spesifik.'],
        betterAnswerExample:
          'Saya membangun model fraud classifier dan mengukur dampaknya dengan F1 score.',
        followUpQuestion: 'Bagaimana Anda memilih fitur untuk model tersebut?',
      },
    },
    {
      id: 'turn-2',
      turnIndex: 2,
      questionText: 'Bagaimana Anda memilih fitur?',
      questionType: 'follow_up',
      answerTranscript: 'Saya membandingkan feature importance dan validasi silang.',
      durationSeconds: 42,
      deliveryQuality: 80,
      fluencyScore: 82,
      confidenceSignal: 78,
      speechPredictionLabel: 'strong',
      nonverbalScore: null,
      evaluation: {
        answerScore: 84,
        dimensionScores: {
          ...dimensionScores,
          relevance: 90,
          structure: 82,
        },
        strengths: ['Relevan dengan target posisi.'],
        improvements: ['Jelaskan tradeoff antar fitur.'],
        betterAnswerExample:
          'Saya memilih fitur dengan kombinasi domain knowledge, feature importance, dan validasi silang.',
        followUpQuestion: null,
      },
    },
  ]);

  assert.equal(report.overallScore, 79);
  assert.equal(report.dimensionSummary.relevance, 85);
  assert.equal(report.speechSummary.deliveryQuality, 75);
  assert.deepEqual(report.speechSummary.labelDistribution, {
    developing: 1,
    strong: 1,
  });
  assert.deepEqual(report.strengths, ['Relevan dengan target posisi.']);
  assert.equal(report.turns.length, 2);
});

test('generateSessionReportFromTurns rejects answered turns without evaluation data', () => {
  assert.throws(
    () =>
      generateSessionReportFromTurns([
        {
          id: 'turn-1',
          turnIndex: 1,
          questionText: 'Ceritakan pengalaman Anda.',
          questionType: 'hr',
          answerTranscript: 'Saya pernah memimpin proyek.',
          durationSeconds: 20,
          deliveryQuality: null,
          fluencyScore: null,
          confidenceSignal: null,
          speechPredictionLabel: null,
          nonverbalScore: null,
          evaluation: null,
        },
      ]),
    (error) => error instanceof ReportGenerationError,
  );
});
