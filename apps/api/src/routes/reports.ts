import { Router } from 'express';
import { fail } from '../utils/api-response.js';

export const reportsRouter = Router();

reportsRouter.use((_request, response) => {
  response
    .status(501)
    .json(fail('VALIDATION_ERROR', 'Report routes will be implemented in Phase 8.'));
});
