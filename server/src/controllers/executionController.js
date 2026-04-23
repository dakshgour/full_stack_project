import { executeVisualization } from '../services/traceService.js';
import { fail, ok } from '../utils/response.js';
import { validateExecutionPayload } from '../utils/validation.js';

export function createExecutionController(repositories) {
  return {
    async execute(req, res, next) {
      try {
        validateExecutionPayload(req.body);
        const result = executeVisualization(req.body);
        const execution = await repositories.executions.create(req.user.id, {
          savedCodeId: req.body.savedCodeId ?? null,
          language: req.body.language,
          patternDetected: result.patternDetected,
          input: { inputOverride: req.body.inputOverride || '' },
          output: result,
          status: 'success',
        });
        res.status(201).json(ok({ execution, result }, 'Execution completed'));
      } catch (error) {
        try {
          await repositories.executions.create(req.user?.id || 0, {
            savedCodeId: req.body.savedCodeId ?? null,
            language: req.body.language || 'unknown',
            patternDetected: 'unknown',
            input: { inputOverride: req.body.inputOverride || '' },
            output: null,
            status: 'failed',
            errorMessage: error.message || 'Execution failed',
          });
        } catch {}
        next(error.message ? fail(error.message, error.status || 422) : error);
      }
    },

    async list(req, res, next) {
      try {
        const executions = await repositories.executions.listByUser(req.user.id);
        res.json(ok({ executions }));
      } catch (error) {
        next(error);
      }
    },

    async getById(req, res, next) {
      try {
        const execution = await repositories.executions.getByIdForUser(req.user.id, req.params.id);
        if (!execution) throw fail('Execution not found', 404);
        res.json(ok({ execution }));
      } catch (error) {
        next(error);
      }
    },
  };
}
