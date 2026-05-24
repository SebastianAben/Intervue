import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyTranscriptCorrections,
  buildTranscriptCorrectionDictionary,
  shouldReviewTranscriptCorrection,
  type TargetApplication,
} from '@intervue/shared';

const target: TargetApplication = {
  candidateCvText: 'Competition project details mention LightGBM and feature stores.',
  candidateSummary:
    'Built a Fraud Classifier with Scikit-learn, XGBoost, SQL, and TensorFlow for risk analytics.',
  company: 'Tokopedia',
  createdAt: '2026-05-22T00:00:00.000Z',
  id: 'target-1',
  industry: 'Technology',
  interviewType: 'technical',
  jobDescription: 'Work with API integrations, ETL pipelines, and dashboard metrics.',
  language: 'id',
  level: 'intern',
  role: 'Data Science Intern',
  skillRequirements: 'Python, SQL, Scikit-learn, TensorFlow, API design',
  status: 'active',
  updatedAt: '2026-05-22T00:00:00.000Z',
};

test('buildTranscriptCorrectionDictionary extracts dynamic target terms', () => {
  const dictionary = buildTranscriptCorrectionDictionary(target);
  const terms = dictionary.map((entry) => entry.term);

  assert.ok(terms.includes('Tokopedia'));
  assert.ok(terms.includes('Scikit-learn'));
  assert.ok(terms.includes('TensorFlow'));
  assert.ok(terms.includes('SQL'));
});

test('applyTranscriptCorrections fixes context terms without hardcoded domain library', () => {
  const result = applyTranscriptCorrections(
    'Saya membuat fraud classifier memakai scikit learn tensor flow dan sql untuk tokopedia.',
    target,
  );

  assert.match(result.correctedTranscript, /Scikit-learn/);
  assert.match(result.correctedTranscript, /TensorFlow/);
  assert.match(result.correctedTranscript, /SQL/);
  assert.match(result.correctedTranscript, /Tokopedia/);
  assert.equal(result.rawTranscript.includes('scikit learn'), true);
  assert.ok(result.corrections.length >= 4);
});

test('applyTranscriptCorrections does not replace substrings inside unrelated words', () => {
  const result = applyTranscriptCorrections('nosqlite bukan sql dan apical bukan api', target);

  assert.match(result.correctedTranscript, /nosqlite/);
  assert.match(result.correctedTranscript, /apical/);
  assert.match(result.correctedTranscript, /\bSQL\b/);
  assert.doesNotMatch(result.correctedTranscript, /APIcal/);
});

test('shouldReviewTranscriptCorrection flags large or short corrected answers', () => {
  const result = applyTranscriptCorrections('sql api', target);

  assert.equal(shouldReviewTranscriptCorrection(result), true);
});
