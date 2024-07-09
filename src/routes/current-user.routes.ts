import { readCurrentUser, resendEmail } from '@auth/controllers/current-user.controller';
import express, { Router } from 'express';

const router: Router = express.Router();

export function currentUserRoutes(): Router {
  router.get('/current-user', readCurrentUser);
  router.post('/resend-email', resendEmail);
  return router;
}
