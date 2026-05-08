import type { ErrorRequestHandler } from 'express';
import { fail } from '../utils/api-response.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const message = error instanceof Error ? error.message : 'Unexpected server error.';

  response.status(500).json(fail('VALIDATION_ERROR', message));
};
