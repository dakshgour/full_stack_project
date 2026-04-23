import express from 'express';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { createVisualizationController } from '../controllers/visualizationController.js';

export function createVisualizationRouter(repositories) {
  const router = express.Router();
  const controller = createVisualizationController(repositories);
  router.use(authenticateToken);

  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);

  return router;
}
