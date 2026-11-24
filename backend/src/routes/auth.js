const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { signToken } = require('../utils/jwt');

const router = express.Router();

// --- Validation schemas ---
const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  role: z.enum(['VET', 'CLINIC_STAFF', 'DAPH_OFFICER', 'SUPER_ADMIN']).optional(),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// --- POST /api/auth/register ---
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if username already exists
    const existing = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    // Hash password (10 rounds is standard)
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        role: data.role || 'VET',
      },
    });

    // Sign token
    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// --- POST /api/auth/login ---
router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (!user) {
      // Same message for wrong username OR wrong password (security best practice)
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    if (user.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Account is inactive. Contact administrator.' });
    }

    // Compare password
    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Sign token
    const token = signToken({
      userId: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    });

    // Record login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;