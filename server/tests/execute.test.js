import request from 'supertest';
import { makeTestApp, registerAndVerify } from './appTestUtils.js';

describe('execution routes', () => {
  test('python execution returns traced local variables', async () => {
    const { app, repositories } = makeTestApp();
    const { token } = await registerAndVerify({
      app,
      repositories,
      request,
      email: 'exec@example.com',
      name: 'Executor',
    });

    const response = await request(app)
      .post('/api/execute')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'from typing import List\n\nclass Solution:\n    def maxDistance(self, colors: List[int]) -> int:\n        ans = -1\n        n = len(colors)\n        for i in range(n):\n            for j in range(n):\n                if colors[i] != colors[j]:\n                    ans = max(abs(i - j), ans)\n        return ans\n',
        language: 'python',
        inputOverride: 'colors: [1,1,2,3,1]',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.result.patternDetected).toBe('array');
    expect(response.body.data.result.steps.length).toBeGreaterThan(1);
    expect(response.body.data.result.runtime.result).toBe(3);
    expect(response.body.data.result.steps.some((step) => step.vars.ans !== undefined)).toBe(true);
    expect(response.body.data.result.steps.some((step) => step.vars.i !== undefined)).toBe(true);
  });

  test('restricted code is rejected', async () => {
    const { app, repositories } = makeTestApp();
    const { token } = await registerAndVerify({
      app,
      repositories,
      request,
      email: 'blocked@example.com',
      name: 'Executor',
    });

    const response = await request(app)
      .post('/api/execute')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'import os\n\nclass Solution:\n    def run(self, nums):\n        return len(nums)\n',
        language: 'python',
        inputOverride: '',
      });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
  });
});
