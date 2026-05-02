import express from 'express';
import { playgroundController } from '../controllers/playgroundController.js';

/**
 * /api/playground — public routes, no auth required.
 */
export function createPlaygroundRouter() {
  const router = express.Router();

  // POST /api/playground/trace
  router.post('/trace', playgroundController.trace);

  return router;
}
