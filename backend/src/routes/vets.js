const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('SUPER_ADMIN', 'DAPH_OFFICER'));

const vetSchema = z.object({
  fullName: z.string().min(2).max(100),
  slvcRegNo: z.string().min(2).max(50),
  employmentType: z.enum(['GOV', 'NGO', 'PRIVATE', 'ACADEMIC', 'MOBILE']).default('PRIVATE'),
  workplace: z.string().max(100).optional().or(z.literal('')),
  district: z.string().max(50).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'SUSPENDED']).default('ACTIVE'),
  notes: z.string().max(500).optional().or(z.literal('')),
});

// GET /api/vets
router.get('/', async (req, res) => {
  try {
    const vets = await prisma.vet.findMany({
      orderBy: { fullName: 'asc' },
      include: {
        _count: { select: { users: true } },
      },
    });
    res.json(vets);
  } catch (err) {
    console.error('List vets error:', err);
    res.status(500).json({ error: 'Failed to list vets' });
  }
});

// POST /api/vets
router.post('/', async (req, res) => {
  try {
    const data = vetSchema.parse(req.body);

    const existing = await prisma.vet.findUnique({
      where: { slvcRegNo: data.slvcRegNo },
    });
    if (existing) {
      return res.status(409).json({ error: 'SLVC Reg. No. already registered' });
    }

    const vet = await prisma.vet.create({
      data: {
        fullName: data.fullName,
        slvcRegNo: data.slvcRegNo,
        employmentType: data.employmentType,
        workplace: data.workplace || null,
        district: data.district || null,
        phone: data.phone || null,
        email: data.email || null,
        status: data.status,
        notes: data.notes || null,
      },
    });

    res.status(201).json(vet);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    console.error('Create vet error:', err);
    res.status(500).json({ error: 'Failed to create vet' });
  }
});

// PUT /api/vets/:id
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const data = vetSchema.partial().parse(req.body);

    // If changing SLVC, ensure uniqueness
    if (data.slvcRegNo) {
      const existing = await prisma.vet.findUnique({
        where: { slvcRegNo: data.slvcRegNo },
      });
      if (existing && existing.id !== id) {
        return res.status(409).json({ error: 'SLVC Reg. No. already used by another vet' });
      }
    }

    const vet = await prisma.vet.update({
      where: { id },
      data: {
        fullName: data.fullName,
        slvcRegNo: data.slvcRegNo,
        employmentType: data.employmentType,
        workplace: data.workplace ?? undefined,
        district: data.district ?? undefined,
        phone: data.phone ?? undefined,
        email: data.email ?? undefined,
        status: data.status,
        notes: data.notes ?? undefined,
      },
    });

    res.json(vet);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    if (err.code === 'P2025') return res.status(404).json({ error: 'Vet not found' });
    console.error('Update vet error:', err);
    res.status(500).json({ error: 'Failed to update vet' });
  }
});

module.exports = router;