import { jest } from '@jest/globals';
import { createApp } from '../src/app.js';
import { createMemoryRepositories } from '../src/repositories/memoryRepository.js';

jest.setTimeout(20000);

export function makeTestApp() {
  const repositories = createMemoryRepositories();
  repositories.progress._codes = repositories.codes;
  repositories.progress._executions = repositories.executions;
  repositories.progress._visualizations = repositories.visualizations;
  return { app: createApp(repositories), repositories };
}

export async function registerAndVerify({ app, repositories, request, email, password = 'SecurePass123!', name = 'Test User' }) {
  await request(app).post('/api/auth/signup').send({
    email,
    password,
    name,
  });

  const pendingUser = await repositories.users.findByEmail(email);
  const verify = await request(app).post('/api/auth/verify-email').send({
    email,
    otp: pendingUser.verificationOtp,
  });

  return {
    token: verify.body.data.token,
    user: verify.body.data.user,
  };
}
