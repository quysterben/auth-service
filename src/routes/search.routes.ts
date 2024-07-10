import { gigs, singleGig } from '@auth/controllers/search.controller';
import express, { Router } from 'express';

const router: Router = express.Router();

export function searchRoutes(): Router {
  router.get('/search/gig/:from/:size/:type', gigs);
  router.get('/search/gig/:gigId', singleGig);
  return router;
}
