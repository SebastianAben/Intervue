import { Router } from 'express';
import { fail } from '../utils/api-response.js';

export const targetsRouter = Router();

targetsRouter.use((_request, response) => {
  response
    .status(501)
    .json(fail('VALIDATION_ERROR', 'Target lamaran routes will be implemented in Phase 4.'));
});
