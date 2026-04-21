import request from 'supertest';
import { makeTestApp } from './appTestUtils.js';

async function createUserToken(app, email) {
  const signup = await request(app).post('/api/auth/signup').send({
    email,
    password: 'SecurePass123!',
    name: 'Code Owner',
  });
  return signup.body.data.token;
}

describe('codes routes', () => {
  test('user can create and fetch owned code', async () => {
    const { app } = makeTestApp();
    const token = await createUserToken(app, 'owner@example.com');

    const create = await request(app)
      .post('/api/codes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Binary Search Demo',
        code: 'function binarySearch(arr, target) { return -1; }',
        language: 'javascript',
        dsaPattern: 'binarySearch',
        tags: ['search'],
        testCases: [{ label: 'Case 1', input: { array: [1, 2, 3], target: 2 } }],
      });

    expect(create.status).toBe(201);
    expect(create.body.data.code.testCases).toHaveLength(1);

    const get = await request(app)
      .get(`/api/codes/${create.body.data.code.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(get.status).toBe(200);
    expect(get.body.data.code.title).toBe('Binary Search Demo');
  });

  test('other users cannot read another user code', async () => {
    const { app } = makeTestApp();
    const ownerToken = await createUserToken(app, 'owner@example.com');
    const otherToken = await createUserToken(app, 'other@example.com');

    const create = await request(app)
      .post('/api/codes')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        title: 'Tree Demo',
        code: 'def inorder(root): return []',
        language: 'python',
        dsaPattern: 'tree',
        tags: [],
      });

    const get = await request(app)
      .get(`/api/codes/${create.body.data.code.id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(get.status).toBe(404);
  });
});
