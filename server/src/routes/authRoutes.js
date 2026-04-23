import bcrypt from 'bcryptjs';
import express from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { authenticateToken } from '../middleware/authenticateToken.js';
import { generateOtp, otpExpiresAt, sendVerificationEmail, sendPasswordResetEmail } from '../services/emailService.js';
import { fail, ok } from '../utils/response.js';
import { validateLogin, validateSignup, validateVerifyEmail, validateForgotPassword, validateResetPassword } from '../utils/validation.js';

export function createAuthRouter(repositories) {
  const router = express.Router();

  // Signup — generates OTP, sends verification email, does NOT return token
  router.post('/signup', async (req, res, next) => {
    try {
      validateSignup(req.body);
      const existing = await repositories.users.findByEmail(req.body.email.toLowerCase().trim());
      if (existing) throw fail('Email already registered', 409);

      const otp = generateOtp();
      const expiresAt = otpExpiresAt(10);
      const passwordHash = await bcrypt.hash(req.body.password, 10);

      await repositories.users.create({
        name: req.body.name.trim(),
        email: req.body.email.toLowerCase().trim(),
        passwordHash,
        verificationOtp: otp,
        otpExpiresAt: expiresAt,
      });

      await sendVerificationEmail(req.body.email.toLowerCase().trim(), otp);

      res.status(201).json(ok(
        { email: req.body.email.toLowerCase().trim() },
        'Verification OTP sent to your email. Please check your inbox.',
      ));
    } catch (error) {
      next(error.message ? fail(error.message, error.status || 400) : error);
    }
  });

  // Verify email — accepts OTP, returns JWT
  router.post('/verify-email', async (req, res, next) => {
    try {
      validateVerifyEmail(req.body);
      const email = req.body.email.toLowerCase().trim();
      const user = await repositories.users.verifyEmail(email, req.body.otp);
      if (!user) throw fail('Invalid or expired OTP', 400);

      const token = jwt.sign({ userId: user.id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
      res.json(ok({ token, user: { id: user.id, email: user.email, name: user.name } }, 'Email verified successfully'));
    } catch (error) {
      next(error.message ? fail(error.message, error.status || 400) : error);
    }
  });

  // Resend OTP
  router.post('/resend-otp', async (req, res, next) => {
    try {
      const email = (req.body.email || '').toLowerCase().trim();
      if (!email) throw fail('Email is required', 400);

      const user = await repositories.users.findByEmail(email);
      if (!user) throw fail('No account found with that email', 404);
      if (user.isVerified) throw fail('Email is already verified', 400);

      const otp = generateOtp();
      const expiresAt = otpExpiresAt(10);
      await repositories.users.updateOtp(email, otp, expiresAt);
      await sendVerificationEmail(email, otp);

      res.json(ok({ email }, 'New verification OTP sent to your email'));
    } catch (error) {
      next(error.message ? fail(error.message, error.status || 400) : error);
    }
  });

  // Login — rejects unverified users
  router.post('/login', async (req, res, next) => {
    try {
      validateLogin(req.body);
      const user = await repositories.users.findByEmail(req.body.email.toLowerCase().trim());
      if (!user) throw fail('Invalid email or password', 401);
      if (!user.isVerified) throw fail('Please verify your email first. Check your inbox for the OTP.', 403);

      const valid = await bcrypt.compare(req.body.password, user.passwordHash);
      if (!valid) throw fail('Invalid email or password', 401);

      const token = jwt.sign({ userId: user.id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
      res.json(ok({ token, user: { id: user.id, email: user.email, name: user.name } }));
    } catch (error) {
      next(error);
    }
  });

  // Forgot password — sends reset OTP
  router.post('/forgot-password', async (req, res, next) => {
    try {
      validateForgotPassword(req.body);
      const email = req.body.email.toLowerCase().trim();
      const user = await repositories.users.findByEmail(email);
      // Always respond success to avoid email enumeration
      if (!user) {
        res.json(ok({ email }, 'If this email is registered, a reset code has been sent'));
        return;
      }

      const otp = generateOtp();
      const expiresAt = otpExpiresAt(10);
      await repositories.users.updateResetOtp(email, otp, expiresAt);
      await sendPasswordResetEmail(email, otp);

      res.json(ok({ email }, 'If this email is registered, a reset code has been sent'));
    } catch (error) {
      next(error.message ? fail(error.message, error.status || 400) : error);
    }
  });

  // Reset password
  router.post('/reset-password', async (req, res, next) => {
    try {
      validateResetPassword(req.body);
      const email = req.body.email.toLowerCase().trim();
      const newPasswordHash = await bcrypt.hash(req.body.newPassword, 10);
      const user = await repositories.users.resetPassword(email, req.body.otp, newPasswordHash);
      if (!user) throw fail('Invalid or expired reset code', 400);

      res.json(ok({}, 'Password reset successfully. You can now login with your new password.'));
    } catch (error) {
      next(error.message ? fail(error.message, error.status || 400) : error);
    }
  });

  // Get current user
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
