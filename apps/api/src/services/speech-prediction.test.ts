import assert from 'node:assert/strict';
import test from 'node:test';
import { predictSpeechSignals } from './speech-prediction.js';

test('predictSpeechSignals returns persisted baseline model metadata and bounded scores', () => {
  const prediction = predictSpeechSignals({
    transcript:
      'Saya memimpin proyek dashboard penjualan selama tiga bulan dan meningkatkan waktu analisis tim sebesar tiga puluh persen.',
    durationSeconds: 55,
    retryCount: 0,
    source: 'web_speech_api',
  });

  assert.equal(prediction.speechPredictionModelName, 'phase6-baseline');
  assert.equal(prediction.speechPredictionModelVersion, '0.1.0');
  assert.equal(typeof prediction.speechPredictionLabel, 'string');
  assert.ok(prediction.deliveryQuality >= 0 && prediction.deliveryQuality <= 100);
  assert.ok(prediction.fluencyScore >= 0 && prediction.fluencyScore <= 100);
  assert.ok(prediction.confidenceSignal >= 0 && prediction.confidenceSignal <= 100);
});

test('predictSpeechSignals penalizes filler-heavy retry answers', () => {
  const strong = predictSpeechSignals({
    transcript:
      'Saya menjelaskan konteks, tindakan, dan hasil proyek dengan ringkas serta menyebutkan dampak bisnis yang terukur.',
    durationSeconds: 45,
    retryCount: 0,
    source: 'web_speech_api',
  });
  const weak = predictSpeechSignals({
    transcript: 'Eee jadi kayak umm saya mungkin mengerjakan itu dan ya begitu.',
    durationSeconds: 80,
    retryCount: 3,
    source: 'manual',
  });

  assert.ok(strong.fluencyScore > weak.fluencyScore);
  assert.ok(strong.confidenceSignal > weak.confidenceSignal);
});
