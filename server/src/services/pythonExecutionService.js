import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from '../config/env.js';
import { fail } from '../utils/response.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const tracerPath = path.join(__dirname, 'pythonTracer.py');
const pythonBin = process.env.PYTHON_BIN || 'python3';

export function executePythonTrace({ code, inputOverride = '', patternDetected }) {
  return new Promise((resolve, reject) => {
    const child = spawn(pythonBin, [tracerPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill('SIGKILL');
      reject(fail(`Python execution exceeded ${env.executionTimeoutMs}ms`, 422));
    }, env.executionTimeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(fail(`Unable to start Python tracer: ${error.message}`, 500));
    });

    child.on('close', (codeValue) => {
      clearTimeout(timeout);
      const parsed = (() => {
        try {
          return JSON.parse(stdout || '{}');
        } catch {
          return null;
        }
      })();

      if (codeValue !== 0) {
        const message = parsed?.error || stderr.trim() || 'Python execution failed';
        reject(fail(message, 422));
        return;
      }

      if (!parsed || !Array.isArray(parsed.steps)) {
        reject(fail('Python tracer returned an invalid response', 500));
        return;
      }

      resolve({
        language: 'python',
        patternDetected,
        executionMode: 'python-trace',
        steps: parsed.steps,
        analysis: {
          pattern: patternDetected,
          language: 'Python',
          confidence: 'High',
          input: Object.entries(parsed.input || {}).map(([key, value]) => `${key}=${JSON.stringify(value)}`).join(', ') || 'Manual input',
          mode: `Traced Solution.${parsed.methodName}`,
        },
        runtime: {
          methodName: parsed.methodName,
          parameterNames: parsed.parameterNames,
          result: parsed.result,
        },
      });
    });

    child.stdin.write(JSON.stringify({
      code,
      inputOverride,
      patternDetected,
    }));
    child.stdin.end();
  });
}
