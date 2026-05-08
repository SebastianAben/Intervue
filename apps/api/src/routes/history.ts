import { Router } from 'express';
import { fail } from '../utils/api-response.js';

export const historyRouter = Router();

historyRouter.use((_request, response) => {
  response
    .status(501)
    .json(fail('VALIDATION_ERROR', 'History routes will be implemented in Phase 8.'));
});
