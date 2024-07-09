import { Application } from 'express';
import { verifyGatewayRequest } from '@quysterben/jobber-shared';
import { authRoutes } from '@auth/routes/auth.routes';
import { currentUserRoutes } from '@auth/routes/current-user.routes';

const BASE_APP = '/api/v1/auth';

export function appRoutes(app: Application): void {
  app.use(BASE_APP, verifyGatewayRequest, authRoutes());
  app.use(BASE_APP, verifyGatewayRequest, currentUserRoutes());
}
