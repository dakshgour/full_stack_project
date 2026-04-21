import express from 'express';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { fail, ok } from '../utils/response.js';
import { validateCodePayload } from '../utils/validation.js';

function normalizeCodePayload(body) {
  return {
    title: body.title?.trim(),
    code: body.code,
    language: body.language,
    dsaPattern: body.dsaPattern,
    tags: Array.isArray(body.tags) ? body.tags.filter(Boolean) : [],
    testCases: Array.isArray(body.testCases) ? body.testCases.map((item, index) => ({
      label: item.label || `Case ${index + 1}`,
      input: item.input ?? {},
      expected: item.expected ?? null,
    })) : [],
  };
}

export function createCodeRouter(repositories) {
  const router = express.Router();
  router.use(authenticateToken);

  router.post('/', async (req, res, next) => {
    try {
      const payload = normalizeCodePayload(req.body);
      validateCodePayload(payload);
      const created = await repositories.codes.create(req.user.id, payload);
      res.status(201).json(ok({ code: created }, 'Code saved successfully'));
    } catch (error) {
      next(error.message ? fail(error.message, error.status || 400) : error);
    }
  });

  router.get('/', async (req, res, next) => {
    try {
      const codes = await repositories.codes.listByUser(req.user.id);
      res.json(ok({ codes }));
    } catch (error) {
      next(error);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const code = await repositories.codes.getByIdForUser(req.user.id, req.params.id);
      if (!code) throw fail('Code not found', 404);
      res.json(ok({ code }));
    } catch (error) {
      next(error);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const payload = normalizeCodePayload(req.body);
      validateCodePayload(payload);
      const updated = await repositories.codes.update(req.user.id, req.params.id, payload);
      if (!updated) throw fail('Code not found', 404);
      res.json(ok({ code: updated }, 'Code updated successfully'));
    } catch (error) {
      next(error.message ? fail(error.message, error.status || 400) : error);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const removed = await repositories.codes.remove(req.user.id, req.params.id);
      if (!removed) throw fail('Code not found', 404);
      res.json(ok({}, 'Code deleted successfully'));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
