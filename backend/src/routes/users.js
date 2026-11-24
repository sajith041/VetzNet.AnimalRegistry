const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('SUPER_ADMIN', 'DAPH_OFFICER'));

function requireSuperAdmin(req, res, next) {
  if (req.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Only SUPER_ADMIN can manage users' });
  }
  next();
}

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  fullName: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  role: z.enum(['VET', 'CLINIC_STAFF', 'DAPH_OFFICER', 'SUPER_ADMIN']),
  preferredLang: z.enum(['en', 'si', 'ta']).default('en'),
  vetId: z.number().int().positive().optional().nullable(),
});

const updateUserSchema = z.object({
  fullName: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  role: z.enum(['VET', 'CLINIC_STAFF', 'DAPH_OFFICER', 'SUPER_ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  preferredLang: z.enum(['en', 'si', 'ta']).optional(),
  vetId: z.number().int().positive().optional().nullable(),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6).max(100),
});

function sanitize(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const { search = '', role, status } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        vet: {
          select: { id: true, fullName: true, slvcRegNo: true },
        },
      },
    });

    res.json(users.map(sanitize));
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        vet: {
          select: { id: true, fullName: true, slvcRegNo: true },
        },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(sanitize(user));
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// POST /api/users
router.post('/', requireSuperAdmin, async (req, res) => {
  try {
    const data = createUserSchema.parse(req.body);

    const existing = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existing) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    if (data.vetId) {
      const vet = await prisma.vet.findUnique({ where: { id: data.vetId } });
      if (!vet) return res.status(400).json({ error: 'Vet profile not found' });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        passwordHash,
        fullName: data.fullName || null,
        email: data.email || null,
        role: data.role,
        preferredLang: data.preferredLang,
        vetId: data.vetId || null,
      },
      include: {
        vet: {
          select: { id: true, fullName: true, slvcRegNo: true },
        },
      },
    });

    res.status(201).json(sanitize(user));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id
router.put('/:id', requireSuperAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const data = updateUserSchema.parse(req.body);

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return res.status(404).json({ error: 'User not found' });

    const isDemotingAdmin = target.role === 'SUPER_ADMIN' && data.role && data.role !== 'SUPER_ADMIN';
    const isDeactivatingAdmin = target.role === 'SUPER_ADMIN' && data.status === 'INACTIVE';

    if (isDemotingAdmin || isDeactivatingAdmin) {
      const adminCount = await prisma.user.count({
        where: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
      });
      if (adminCount <= 1) {
        return res.status(409).json({
          error: 'Cannot demote/deactivate the last active SUPER_ADMIN',
        });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName ?? undefined,
        email: data.email ?? undefined,
        role: data.role,
        status: data.status,
        preferredLang: data.preferredLang,
        vetId: data.vetId === null ? null : data.vetId,
      },
      include: {
        vet: {
          select: { id: true, fullName: true, slvcRegNo: true },
        },
      },
    });

    res.json(sanitize(user));
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// POST /api/users/:id/reset-password
router.post('/:id/reset-password', requireSuperAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const data = resetPasswordSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 10);

    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;