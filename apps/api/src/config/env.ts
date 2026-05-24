import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-3.5-flash'),
  JWT_SECRET: z.string().optional(),
  NONVERBAL_INFERENCE_URL: z.string().url().default('http://127.0.0.1:8765/predict'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  SESSION_COOKIE_DOMAIN: z.string().optional(),
});

export const env = envSchema.parse(process.env);
