import { ok } from '../utils/response.js';

export function createProgressController(repositories) {
  return {
    async getSummary(req, res, next) {
      try {
        const summary = await repositories.progress.getSummary(req.user.id);
        res.json(ok({ summary }));
      } catch (error) {
        next(error);
      }
    },

    async getDashboard(req, res, next) {
      try {
        const dashboard = await repositories.progress.getDashboard(req.user.id);
        res.json(ok(dashboard));
      } catch (error) {
        next(error);
      }
    },
  };
}
