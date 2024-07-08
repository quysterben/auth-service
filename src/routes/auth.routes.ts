import { read } from '@auth/controllers/signin.controller';
import { create } from '@auth/controllers/signup.controller';
import express, { Router } from 'express';

const router: Router = express.Router();

export function authRoutes(): Router {
  router.post('/signup', create);
  router.post('/signin', read);

  return router;
}
