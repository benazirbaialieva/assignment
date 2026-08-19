import express from 'express';
import { config } from './config.js';
import { requestContext } from './middleware/requestContext.js';
import { chaos } from './middleware/chaos.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { usersRouter } from './routes/users.js';
import { transactionsRouter } from './routes/transactions.js';
import { supportRouter } from './routes/support.js';
import { seedFixtures } from './seed.js';

/**
 * The API Gateway: one HTTP surface in front of the User, Transaction and
 * Notification services.
 */
export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));
  app.use(requestContext);
  app.use(chaos);

  app.use(supportRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/transactions', transactionsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  if (config.seedFixtures) seedFixtures();

  return app;
}
