import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authLimiter, generalLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';
import { sanitize } from './middleware/sanitize.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { createAuthRouter } from './routes/authRoutes.js';
import { createCodeRouter } from './routes/codeRoutes.js';
import { createExecutionRouter } from './routes/executionRoutes.js';
import { createProgressRouter } from './routes/progressRoutes.js';
import { createVisualizationRouter } from './routes/visualizationRoutes.js';

function createCorsOriginMatcher() {
  const configuredOrigins = String(env.clientOrigin || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://full-stack-project-xi-ten.vercel.app',
  ];

  const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);

  return (origin, callback) => {
    // Non-browser requests like curl or health checks may not send an Origin header.
    if (!origin) {
      callback(null, true);
      return;
    }

    const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);
    const isVercelPreview = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);

    if (allowedOrigins.has(origin) || isLocalhost || isVercelPreview) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`));
  };
}

export function createApp(repositories) {
  const app = express();

  // Global middleware
  app.use(securityHeaders);
  app.use(cors({ origin: createCorsOriginMatcher(), credentials: false }));
  app.use(express.json({ limit: '256kb' }));
  app.use(requestLogger);
  app.use(sanitize);

  // Health check
  app.get('/api/health', async (_req, res) => {
    const health = await repositories.health();
    res.json({ success: true, data: health });
  });

  // Routes with rate limiting
  app.use('/api/auth', authLimiter, createAuthRouter(repositories));
  app.use('/api/codes', generalLimiter, createCodeRouter(repositories));
  app.use('/api/execute', generalLimiter, createExecutionRouter(repositories));
  app.use('/api/visualizations', generalLimiter, createVisualizationRouter(repositories));
  app.use('/api/progress', generalLimiter, createProgressRouter(repositories));

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
