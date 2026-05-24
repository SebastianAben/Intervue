import assert from 'node:assert/strict';
import test from 'node:test';
import { summarizeCvText } from './cv-summary.js';

const geminiSuccessPayload = {
  candidates: [
    {
      content: {
        parts: [
          {
            text: JSON.stringify({
              bullets: [
                'Berpengalaman mengelola riset pengguna untuk produk SaaS B2B.',
                'Menguasai Figma, usability testing, dan sintesis insight.',
                'Pernah memimpin proyek redesign onboarding dengan metrik aktivasi.',
              ],
            }),
          },
        ],
      },
    },
  ],
};

test('summarizeCvText returns readable bullet points from Gemini JSON', async () => {
  const summary = await summarizeCvText('Candidate has SaaS research and onboarding experience.', {
    apiKey: 'test-key',
    fetchImpl: async () =>
      new Response(JSON.stringify(geminiSuccessPayload), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }),
  });

  assert.equal(summary.summaryGenerated, true);
  assert.match(summary.summary, /^- Berpengalaman/m);
  assert.match(summary.summary, /\n- Menguasai/);
});

test('summarizeCvText falls back to parsed CV text when Gemini fails', async () => {
  const parsedText = 'Raw parsed CV text that should remain useful to the user.';
  const summary = await summarizeCvText(parsedText, {
    apiKey: 'test-key',
    fetchImpl: async () => new Response('quota exceeded', { status: 429 }),
  });

  assert.deepEqual(summary, {
    summary: parsedText,
    summaryGenerated: false,
  });
});
