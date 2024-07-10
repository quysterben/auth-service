import { create } from '@auth/controllers/seed.controller';
import express, { Router } from 'express';

const router: Router = express.Router();

export function seedRoutes(): Router {
  router.get('/seed/:count', create);
  return router;
}
