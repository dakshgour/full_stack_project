import express from 'express';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { createExecutionController } from '../controllers/executionController.js';

export function createExecutionRouter(repositories) {
  const router = express.Router();
  const controller = createExecutionController(repositories);
  router.use(authenticateToken);

  router.post('/', controller.execute);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);

  return router;
}
