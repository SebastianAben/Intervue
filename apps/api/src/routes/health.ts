import { Router } from 'express';
import { ok } from '../utils/api-response.js';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.json(ok({ status: 'ok' as const }));
});
