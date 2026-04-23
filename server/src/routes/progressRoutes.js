import express from 'express';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { createProgressController } from '../controllers/progressController.js';

export function createProgressRouter(repositories) {
  const router = express.Router();
  const controller = createProgressController(repositories);
  router.use(authenticateToken);

  router.get('/summary', controller.getSummary);
  router.get('/dashboard', controller.getDashboard);

  return router;
}
