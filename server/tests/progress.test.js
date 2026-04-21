import request from 'supertest';
import { makeTestApp } from './appTestUtils.js';

describe('progress routes', () => {
  test('dashboard aggregates recent activity', async () => {
    const { app } = makeTestApp();
    const signup = await request(app).post('/api/auth/signup').send({
      email: 'dash@example.com',
      password: 'SecurePass123!',
      name: 'Dashboard User',
    });
    const token = signup.body.data.token;

    const createCode = await request(app)
      .post('/api/codes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Sliding Window',
        code: 'function maxWindowSum(nums, k) { return 0; }',
        language: 'javascript',
        dsaPattern: 'slidingWindow',
        tags: ['window'],
      });

    await request(app)
      .post('/api/visualizations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        savedCodeId: createCode.body.data.code.id,
        pattern: 'slidingWindow',
        input: { array: [1, 2, 3], k: 2 },
        steps: [{ title: 'demo' }],
      });

    await request(app)
      .post('/api/execute')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'function maxWindowSum(nums, k) { return 0; }',
        language: 'javascript',
        inputOverride: 'array: [1,2,3] target: 2',
      });

    const dashboard = await request(app)
      .get('/api/progress/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.summary.savedCodes).toBe(1);
    expect(dashboard.body.data.recentExecutions.length).toBe(1);
    expect(dashboard.body.data.recentVisualizations.length).toBe(1);
  });
});
