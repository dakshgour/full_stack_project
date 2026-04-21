import request from 'supertest';
import { makeTestApp } from './appTestUtils.js';

describe('execution routes', () => {
  test('binary search execution returns generated trace', async () => {
    const { app } = makeTestApp();
    const signup = await request(app).post('/api/auth/signup').send({
      email: 'exec@example.com',
      password: 'SecurePass123!',
      name: 'Executor',
    });

    const response = await request(app)
      .post('/api/execute')
      .set('Authorization', `Bearer ${signup.body.data.token}`)
      .send({
        code: 'function binarySearch(arr, target) { let left = 0; let right = arr.length - 1; while (left <= right) { const mid = left + Math.floor((right - left) / 2); if (arr[mid] === target) return mid; if (arr[mid] < target) left = mid + 1; else right = mid - 1; } return -1; }',
        language: 'javascript',
        inputOverride: 'array: [2,5,8,12,16,23,38] target: 23',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.result.patternDetected).toBe('binarySearch');
    expect(response.body.data.result.steps.length).toBeGreaterThan(1);
  });

  test('restricted code is rejected', async () => {
    const { app } = makeTestApp();
    const signup = await request(app).post('/api/auth/signup').send({
      email: 'exec@example.com',
      password: 'SecurePass123!',
      name: 'Executor',
    });

    const response = await request(app)
      .post('/api/execute')
      .set('Authorization', `Bearer ${signup.body.data.token}`)
      .send({
        code: 'const fs = require(\"fs\");',
        language: 'javascript',
        inputOverride: '',
      });

    expect(response.status).toBe(422);
    expect(response.body.success).toBe(false);
  });
});
