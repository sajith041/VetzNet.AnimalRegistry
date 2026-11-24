const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Person requires NIC (or PASSPORT:xxx for foreigners).
// Organization requires registrationNumber.
const ownerSchema = z
  .object({
    fullName: z.string().min(2).max(100),
    nic: z.string().max(50).optional().or(z.literal('')),
    phone: z.string().max(20).optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().max(200).optional().or(z.literal('')),
    preferredLang: z.enum(['en', 'si', 'ta']).default('en'),
    ownerType: z.enum(['PERSON', 'ORGANIZATION']).default('PERSON'),
    registrationNumber: z.string().max(50).optional().or(z.literal('')),
    contactPerson: z.string().max(100).optional().or(z.literal('')),
    district: z.string().min(1, 'District is required').max(50),
    authorityCode: z.string().max(20).optional().or(z.literal('')),
    verificationStatus: z.enum(['VERIFIED', 'PENDING']).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.ownerType === 'PERSON' && !data.nic) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['nic'],
        message: 'NIC is required for individual owners',
      });
    }
    if (data.ownerType === 'ORGANIZATION' && !data.registrationNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['registrationNumber'],
        message: 'Registration number is required for organizations',
      });
    }
  });

// --- POST /api/owners ---
router.post('/', async (req, res) => {
  try {
    const data = ownerSchema.parse(req.body);

    const clean = {
      fullName: data.fullName,
      nic: data.nic || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      preferredLang: data.preferredLang,
      ownerType: data.ownerType,
      registrationNumber: data.registrationNumber || null,
      contactPerson: data.contactPerson || null,
      district: data.district || null,
      authorityCode: data.authorityCode || null,
      verificationStatus: data.verificationStatus || 'VERIFIED',
    };

    if (clean.nic) {
      const existing = await prisma.owner.findUnique({
        where: { nic: clean.nic },
      });
      if (existing) {
        return res.status(409).json({ error: 'NIC already registered' });
      }
    }

    const owner = await prisma.owner.create({ data: clean });
    res.status(201).json(owner);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    console.error('Create owner error:', err);
    res.status(500).json({ error: 'Failed to create owner' });
  }
});

// --- GET /api/owners ---
router.get('/', async (req, res) => {
  try {
    const { search = '', page = '1', limit = '20' } = req.query;
    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { nic: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { registrationNumber: { contains: search, mode: 'insensitive' } },
            { authorityCode: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [owners, total] = await Promise.all([
      prisma.owner.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          _count: { select: { animalsCurrent: true } },
        },
      }),
      prisma.owner.count({ where }),
    ]);

    res.json({
      data: owners,
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    console.error('List owners error:', err);
    res.status(500).json({ error: 'Failed to list owners' });
  }
});

// --- GET /api/owners/:id ---
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const owner = await prisma.owner.findUnique({
      where: { id },
      include: {
        animalsCurrent: {
          include: { species: true, microchip: true },
        },
      },
    });

    if (!owner) return res.status(404).json({ error: 'Owner not found' });
    res.json(owner);
  } catch (err) {
    console.error('Get owner error:', err);
    res.status(500).json({ error: 'Failed to get owner' });
  }
});

// --- PUT /api/owners/:id ---
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const data = ownerSchema.parse(req.body);

    const existing = await prisma.owner.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Owner not found' });

    const isAdmin = ['DAPH_OFFICER', 'SUPER_ADMIN'].includes(req.user.role);

    const clean = {
      fullName: data.fullName,
      nic: data.nic || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      preferredLang: data.preferredLang,
      ownerType: data.ownerType,
      registrationNumber: data.registrationNumber || null,
      contactPerson: data.contactPerson || null,
      district: data.district || null,
      authorityCode: data.authorityCode || null,
    };

    // Identity fields locked for non-admins
    if (!isAdmin) {
      const identityChanged =
        clean.fullName !== existing.fullName ||
        clean.nic !== existing.nic ||
        clean.registrationNumber !== existing.registrationNumber ||
        clean.ownerType !== existing.ownerType ||
        clean.authorityCode !== existing.authorityCode;

      if (identityChanged) {
        return res.status(403).json({
          error:
            'Owner identity fields (name, NIC, registration, type, authority code) can only be changed by DAPH officers or Super Admins.',
        });
      }
    }

    // NIC uniqueness check
    if (clean.nic && clean.nic !== existing.nic) {
      const conflict = await prisma.owner.findUnique({
        where: { nic: clean.nic },
      });
      if (conflict && conflict.id !== id) {
        return res.status(409).json({ error: 'NIC already used by another owner' });
      }
    }

    const owner = await prisma.owner.update({
      where: { id },
      data: clean,
    });

    res.json(owner);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Owner not found' });
    }
    console.error('Update owner error:', err);
    res.status(500).json({ error: 'Failed to update owner' });
  }
});

// --- DELETE /api/owners/:id ---
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const animalCount = await prisma.animal.count({
      where: { currentOwnerId: id },
    });
    if (animalCount > 0) {
      return res.status(409).json({
        error: `Cannot delete owner with ${animalCount} registered animal(s)`,
      });
    }

    await prisma.owner.delete({ where: { id } });
    res.json({ message: 'Owner deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Owner not found' });
    }
    console.error('Delete owner error:', err);
    res.status(500).json({ error: 'Failed to delete owner' });
  }
});

module.exports = router;