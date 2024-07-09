import { health } from '@auth/controllers/health.controller';
import express, { Router } from 'express';

const router: Router = express.Router();

export function healthRoutes(): Router {
  router.get('/auth-health', health);
  return router;
}
