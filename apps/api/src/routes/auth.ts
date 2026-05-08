import { Router } from 'express';
import { fail, ok } from '../utils/api-response.js';

export const authRouter = Router();

authRouter.get('/me', (_request, response) => {
  response.status(401).json(fail('UNAUTHORIZED', 'Authentication is not implemented yet.'));
});

authRouter.post('/register', (_request, response) => {
  response
    .status(501)
    .json(fail('VALIDATION_ERROR', 'Register will be implemented in the auth phase.'));
});

authRouter.post('/login', (_request, response) => {
  response
    .status(501)
    .json(fail('VALIDATION_ERROR', 'Login will be implemented in the auth phase.'));
});

authRouter.post('/logout', (_request, response) => {
  response.json(ok({ loggedOut: true }));
});
