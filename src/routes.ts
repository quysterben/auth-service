import { Application } from 'express';
import { verifyGatewayRequest } from '@quysterben/jobber-shared';
import { authRoutes } from '@auth/routes/auth.routes';
import { currentUserRoutes } from '@auth/routes/current-user.routes';
import { healthRoutes } from '@auth/routes/health.routes';
import { searchRoutes } from '@auth/routes/search.routes';
import { seedRoutes } from '@auth/routes/seed.routes';

const BASE_APP = '/api/v1/auth';

export function appRoutes(app: Application): void {
  app.use('', healthRoutes());
  
  app.use(BASE_APP, verifyGatewayRequest, authRoutes());
  app.use(BASE_APP, verifyGatewayRequest, currentUserRoutes());

  app.use(BASE_APP, searchRoutes());
  app.use(BASE_APP, seedRoutes());
}
