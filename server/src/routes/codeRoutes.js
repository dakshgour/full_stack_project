import express from 'express';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { createCodeController } from '../controllers/codeController.js';

export function createCodeRouter(repositories) {
  const router = express.Router();
  const controller = createCodeController(repositories);
  router.use(authenticateToken);

  router.post('/', controller.create);
  router.get('/', controller.list);
  router.get('/:id', controller.getById);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);

  return router;
}
