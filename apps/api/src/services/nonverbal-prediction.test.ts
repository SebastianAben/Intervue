import assert from 'node:assert/strict';
import test from 'node:test';
import type { NonverbalFeatures } from '@intervue/shared';
import { nonverbalFeatureOrder } from './nonverbal-prediction.js';

test('nonverbalFeatureOrder matches the exported model feature schema', () => {
  const expected: Array<keyof NonverbalFeatures> = [
    'face_detected_ratio',
    'head_yaw_mean',
    'head_yaw_std',
    'head_pitch_mean',
    'head_pitch_std',
    'head_roll_mean',
    'head_roll_std',
    'mouth_movement_mean',
    'mouth_movement_std',
    'shoulder_movement_mean',
    'shoulder_movement_std',
    'hand_movement_mean',
    'hand_movement_std',
    'frame_count',
    'analyzed_duration_seconds',
  ];

  assert.deepEqual([...nonverbalFeatureOrder], expected);
});
