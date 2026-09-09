import express from 'express';
import router from './routes';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { correlationId } from './lib/correlation/correlationId';
import { errorHandler } from './lib/error/errorHandler';
import { env } from './lib/config/env';
import helmet from 'helmet';

export default function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.cors.origins, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(correlationId);
  app.use('/api', router);
  app.use(errorHandler);

  return app;
}
