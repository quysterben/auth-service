import { readCurrentUser, resendEmail } from '@auth/controllers/current-user.controller';
import { token } from '@auth/controllers/refresh-token.controller';
import express, { Router } from 'express';

const router: Router = express.Router();

export function currentUserRoutes(): Router {
  router.get('/currentuser', readCurrentUser);
  router.post('/resend-email', resendEmail);
  router.get('/refresh-token/:username', token);
  return router;
}
