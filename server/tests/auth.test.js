import request from 'supertest';
import { makeTestApp } from './appTestUtils.js';

describe('auth routes', () => {
  test('signup and me flow works', async () => {
    const { app } = makeTestApp();
    const signup = await request(app).post('/api/auth/signup').send({
      email: 'user@example.com',
      password: 'SecurePass123!',
      name: 'Test User',
    });

    expect(signup.status).toBe(201);
    expect(signup.body.success).toBe(true);
    expect(signup.body.data.token).toBeTruthy();

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${signup.body.data.token}`);

    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('user@example.com');
  });

  test('login rejects bad password', async () => {
    const { app } = makeTestApp();
    await request(app).post('/api/auth/signup').send({
      email: 'user@example.com',
      password: 'SecurePass123!',
      name: 'Test User',
    });

    const login = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'wrong-pass',
    });

    expect(login.status).toBe(401);
    expect(login.body.success).toBe(false);
  });
});
