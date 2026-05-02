import { detectCodeTarget } from '../services/traceService.js';
import { executePythonTrace } from '../services/pythonExecutionService.js';
import { fail, ok } from '../utils/response.js';

/**
 * Public playground controller — no authentication required.
 * Accepts a Python code snippet + optional input, runs it through
 * pythonTracer.py and returns the step-by-step trace.
 */
export const playgroundController = {
  async trace(req, res, next) {
    try {
      const { code, inputOverride = '' } = req.body || {};

      if (!code || typeof code !== 'string') {
        return next(fail('code is required and must be a string', 400));
      }
      if (code.trim().length === 0) {
        return next(fail('code must not be empty', 400));
      }
      if (code.length > 12000) {
        return next(fail('code exceeds the maximum allowed length of 12 000 characters', 413));
      }

      const patternDetected = detectCodeTarget(code);

      const result = await executePythonTrace({
        code,
        inputOverride: typeof inputOverride === 'string' ? inputOverride : '',
        patternDetected,
      });

      res.json(ok(result, 'Trace completed'));
    } catch (error) {
      next(error.status ? error : fail(error.message || 'Trace failed', 422));
    }
  },
};
