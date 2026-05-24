import { z } from 'zod';
import { env } from '../config/env.js';
import { classifyGeminiHttpError } from './gemini-interview.js';

const cvSummarySchema = z.object({
  bullets: z.array(z.string().trim().min(1).max(500)).min(1).max(10),
});

const cvSummaryResponseJsonSchema = {
  type: 'object',
  properties: {
    bullets: {
      type: 'array',
      items: {
        type: 'string',
      },
    },
  },
  required: ['bullets'],
} as const;

type FetchImpl = typeof fetch;

export type CvSummaryResult = {
  summary: string;
  summaryGenerated: boolean;
};

export type CvSummaryOptions = {
  apiKey?: string;
  fetchImpl?: FetchImpl;
  model?: string;
};

function geminiEndpoint({ apiKey = env.GEMINI_API_KEY, model = env.GEMINI_MODEL }: CvSummaryOptions) {
  if (!apiKey) {
    throw new Error('Gemini API key is not configured on the backend.');
  }

  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model,
  )}:generateContent?key=${encodeURIComponent(apiKey)}`;
}

function responseText(payload: unknown) {
  const parsed = z
    .object({
      candidates: z
        .array(
          z.object({
            content: z.object({
              parts: z.array(
                z.object({
                  text: z.string(),
                }),
              ),
            }),
          }),
        )
        .min(1),
    })
    .safeParse(payload);

  if (!parsed.success) {
    throw new Error('Gemini returned an empty CV summary response.');
  }

  return parsed.data.candidates[0]?.content.parts
    .map((part) => part.text)
    .join('')
    .trim();
}

function buildCvSummaryPrompt(parsedText: string) {
  return [
    'Ringkas CV kandidat dalam sudut pandang kandidat sendiri.',
    'Gunakan Bahasa Indonesia profesional.',
    'Return valid JSON only.',
    'Buat 6-10 bullet points yang mudah dibaca user.',
    'Fokus pada pengalaman, pendidikan, skill utama, proyek, organisasi, sertifikasi, dan pencapaian yang tertulis di CV.',
    'Jangan menulis bullet khusus seperti "Catatan Interview", "Konteks Interview", atau instruksi untuk interviewer.',
    'Jangan mengarang fakta yang tidak ada di CV.',
    'Setiap bullet maksimal 180 karakter.',
    '',
    'Parsed CV text:',
    parsedText,
  ].join('\n');
}

function formatBullets(bullets: string[]) {
  return bullets.map((bullet) => `- ${bullet}`).join('\n');
}

export async function summarizeCvText(
  parsedText: string,
  { fetchImpl = fetch, ...options }: CvSummaryOptions = {},
): Promise<CvSummaryResult> {
  try {
    const response = await fetchImpl(geminiEndpoint(options), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: buildCvSummaryPrompt(parsedText),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseJsonSchema: cvSummaryResponseJsonSchema,
        },
      }),
    });

    if (!response.ok) {
      throw classifyGeminiHttpError(response.status, await response.text());
    }

    const parsed = cvSummarySchema.parse(JSON.parse(responseText(await response.json())));

    return {
      summary: formatBullets(parsed.bullets),
      summaryGenerated: true,
    };
  } catch {
    return {
      summary: parsedText,
      summaryGenerated: false,
    };
  }
}
