import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';
import { historyRouter } from './routes/history.js';
import { reportsRouter } from './routes/reports.js';
import { sessionsRouter } from './routes/sessions.js';
import { targetsRouter } from './routes/targets.js';
import { fail } from './utils/api-response.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(morgan('dev'));

  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/targets', targetsRouter);
  app.use('/api/sessions', sessionsRouter);
  app.use('/api/history', historyRouter);
  app.use('/api/reports', reportsRouter);

  app.use((_request, response) => {
    response.status(404).json(fail('VALIDATION_ERROR', 'Route not found.'));
  });

  app.use(errorHandler);

  return app;
}
