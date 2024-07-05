import { Application } from 'express';
import { verifyGatewayRequest } from '@quysterben/jobber-shared';
import { authRoutes } from '@auth/routes/auth.routes';

const BASE_APP = '/api/v1/auth';

export function appRoutes(app: Application): void {
  app.use(BASE_APP, verifyGatewayRequest, authRoutes());
}
