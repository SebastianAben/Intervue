import assert from 'node:assert/strict';
import test from 'node:test';
import { buildInitialQuestion } from './interview-question.js';

test('buildInitialQuestion creates Indonesian target-aware first question', () => {
  const question = buildInitialQuestion({
    role: 'Product Manager',
    company: 'Intervue Labs',
    industry: 'EdTech',
    interviewType: 'behavioral',
    language: 'id',
  });

  assert.match(question.questionText, /Product Manager/);
  assert.match(question.questionText, /Intervue Labs/);
  assert.equal(question.questionType, 'behavioral');
});

test('buildInitialQuestion creates English target-aware first question', () => {
  const question = buildInitialQuestion({
    role: 'Data Analyst',
    company: null,
    industry: 'Finance',
    interviewType: 'technical',
    language: 'en',
  });

  assert.match(question.questionText, /Data Analyst/);
  assert.match(question.questionText, /Finance/);
  assert.equal(question.questionType, 'technical');
});
