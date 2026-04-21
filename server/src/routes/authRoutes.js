import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { fail, ok } from '../utils/response.js';
import { validateLogin, validateSignup } from '../utils/validation.js';

export function createAuthRouter(repositories) {
  const router = express.Router();

  router.post('/signup', async (req, res, next) => {
    try {
      validateSignup(req.body);
      const existing = await repositories.users.findByEmail(req.body.email);
      if (existing) throw fail('Email already registered', 409);
      const passwordHash = await bcrypt.hash(req.body.password, 10);
      const user = await repositories.users.create({
        name: req.body.name.trim(),
        email: req.body.email.toLowerCase().trim(),
        passwordHash,
      });
      const token = jwt.sign({ userId: user.id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
      res.status(201).json(ok({ token, user: { id: user.id, email: user.email, name: user.name } }, 'Signup successful'));
    } catch (error) {
      next(error.message ? fail(error.message, error.status || 400) : error);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      validateLogin(req.body);
      const user = await repositories.users.findByEmail(req.body.email.toLowerCase().trim());
      if (!user) throw fail('Invalid email or password', 401);
      const valid = await bcrypt.compare(req.body.password, user.passwordHash);
      if (!valid) throw fail('Invalid email or password', 401);
      const token = jwt.sign({ userId: user.id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
      res.json(ok({ token, user: { id: user.id, email: user.email, name: user.name } }));
    } catch (error) {
      next(error);
    }
  });

  router.get('/me', authenticateToken, async (req, res, next) => {
    try {
      const user = await repositories.users.findById(req.user.id);
      if (!user) throw fail('User not found', 404);
      res.json(ok({ user: { id: user.id, email: user.email, name: user.name } }));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
