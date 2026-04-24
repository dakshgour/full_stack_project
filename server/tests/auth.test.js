import request from 'supertest';
import { makeTestApp, registerAndVerify } from './appTestUtils.js';

describe('auth routes', () => {
  test('signup and me flow works', async () => {
    const { app, repositories } = makeTestApp();
    const signup = await request(app).post('/api/auth/signup').send({
      email: 'user@example.com',
      password: 'SecurePass123!',
      name: 'Test User',
    });

    expect(signup.status).toBe(201);
    expect(signup.body.success).toBe(true);
    expect(signup.body.data.email).toBe('user@example.com');

    const pendingUser = await repositories.users.findByEmail('user@example.com');
    const verify = await request(app).post('/api/auth/verify-email').send({
      email: 'user@example.com',
      otp: pendingUser.verificationOtp,
    });

    expect(verify.status).toBe(200);
    expect(verify.body.data.token).toBeTruthy();

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${verify.body.data.token}`);

    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('user@example.com');
  });

  test('login rejects bad password after verification', async () => {
    const { app, repositories } = makeTestApp();
    await registerAndVerify({
      app,
      repositories,
      request,
      email: 'user@example.com',
    });

    const login = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'wrong-pass',
    });

    expect(login.status).toBe(401);
    expect(login.body.success).toBe(false);
  });
});
