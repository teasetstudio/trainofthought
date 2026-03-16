import express from 'express';
import { prisma } from '../prisma.js';
import { hashPassword, verifyPassword } from './password.js';
import { signAccessToken } from './token.js';
import { authenticateHttpRequest } from './httpAuth.js';

const MIN_PASSWORD_LENGTH = 8;
const MAX_DISPLAY_NAME_LENGTH = 80;

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function deriveDisplayName(email) {
  return email.split('@')[0] || 'User';
}

function sanitizeDisplayName(displayName, email) {
  const fallback = deriveDisplayName(email);
  const candidate = String(displayName || fallback).trim() || fallback;
  return candidate.slice(0, MAX_DISPLAY_NAME_LENGTH);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function toSafeUser(user) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function createAuthRouter() {
  const router = express.Router();

  router.post('/register', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const displayName = sanitizeDisplayName(req.body?.displayName, email);

    if (!isValidEmail(email)) {
      res.status(422).json({ error: 'Invalid email' });
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      res.status(422).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
      return;
    }

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(409).json({ error: 'Email already in use' });
        return;
      }

      const passwordHash = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          displayName,
        },
      });

      const token = signAccessToken(user);
      res.status(201).json({ token, user: toSafeUser(user) });
    } catch {
      res.status(500).json({ error: 'Registration failed' });
    }
  });

  router.post('/login', async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!isValidEmail(email) || password.length === 0) {
      res.status(422).json({ error: 'Invalid credentials' });
      return;
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const isValidPassword = await verifyPassword(password, user.passwordHash);

      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const token = signAccessToken(user);
      res.status(200).json({ token, user: toSafeUser(user) });
    } catch {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  router.post('/logout', (_req, res) => {
    res.status(204).end();
  });

  router.get('/me', authenticateHttpRequest, async (req, res) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.auth.id } });

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      res.status(200).json({ user: toSafeUser(user) });
    } catch {
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  });

  router.patch('/me', authenticateHttpRequest, async (req, res) => {
    const displayName = String(req.body?.displayName || '').trim();

    if (displayName.length === 0 || displayName.length > MAX_DISPLAY_NAME_LENGTH) {
      res.status(422).json({ error: 'Invalid display name' });
      return;
    }

    try {
      const user = await prisma.user.update({
        where: { id: req.auth.id },
        data: { displayName },
      });

      res.status(200).json({ user: toSafeUser(user) });
    } catch {
      res.status(500).json({ error: 'Failed to update profile' });
    }
  });

  return router;
}
