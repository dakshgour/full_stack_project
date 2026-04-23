import { fail, ok } from '../utils/response.js';

export function createVisualizationController(repositories) {
  return {
    async create(req, res, next) {
      try {
        if (!req.body.pattern || !Array.isArray(req.body.steps)) throw fail('pattern and steps are required', 400);
        const visualization = await repositories.visualizations.create(req.user.id, {
          savedCodeId: req.body.savedCodeId ?? null,
          pattern: req.body.pattern,
          input: req.body.input ?? {},
          steps: req.body.steps,
        });
        res.status(201).json(ok({ visualization }, 'Visualization saved'));
      } catch (error) {
        next(error);
      }
    },

    async list(req, res, next) {
      try {
        const visualizations = await repositories.visualizations.listByUser(req.user.id);
        res.json(ok({ visualizations }));
      } catch (error) {
        next(error);
      }
    },

    async getById(req, res, next) {
      try {
        const visualization = await repositories.visualizations.getByIdForUser(req.user.id, req.params.id);
        if (!visualization) throw fail('Visualization not found', 404);
        res.json(ok({ visualization }));
      } catch (error) {
        next(error);
      }
    },
  };
}
