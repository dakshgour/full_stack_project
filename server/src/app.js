import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createAuthRouter } from './routes/authRoutes.js';
import { createCodeRouter } from './routes/codeRoutes.js';
import { createExecutionRouter } from './routes/executionRoutes.js';
import { createProgressRouter } from './routes/progressRoutes.js';
import { createVisualizationRouter } from './routes/visualizationRoutes.js';

export function createApp(repositories) {
  const app = express();
  app.use(cors({ origin: env.clientOrigin, credentials: false }));
  app.use(express.json({ limit: '256kb' }));

  app.get('/api/health', async (_req, res) => {
    const health = await repositories.health();
    res.json({ success: true, data: health });
  });

  app.use('/api/auth', createAuthRouter(repositories));
  app.use('/api/codes', createCodeRouter(repositories));
  app.use('/api/execute', createExecutionRouter(repositories));
  app.use('/api/visualizations', createVisualizationRouter(repositories));
  app.use('/api/progress', createProgressRouter(repositories));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
