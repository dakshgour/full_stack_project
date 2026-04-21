import express from 'express';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { ok } from '../utils/response.js';

export function createProgressRouter(repositories) {
  const router = express.Router();
  router.use(authenticateToken);

  router.get('/summary', async (req, res, next) => {
    try {
      const summary = await repositories.progress.getSummary(req.user.id);
      res.json(ok({ summary }));
    } catch (error) {
      next(error);
    }
  });

  router.get('/dashboard', async (req, res, next) => {
    try {
      const dashboard = await repositories.progress.getDashboard(req.user.id);
      res.json(ok(dashboard));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
