const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const { certificateUpload, storeUpload, removeUpload, CERT_TYPES } = require('../config/multer');

const router = express.Router();

router.use(requireAuth);

// --- Validation ---
const vaccinationSchema = z.object({
  clientUuid: z.string().min(10).max(60),
  animalId: z.number().int().positive(),
  vaccineType: z.string().default('RABIES'),
  batchNo: z.string().max(50).optional().or(z.literal('')),
  manufacturer: z.string().max(100).optional().or(z.literal('')),
  expiryDate: z.string().optional().or(z.literal('')),
  stickerQr: z.string().max(100).optional().or(z.literal('')),
  administeredDate: z.string().min(1, 'Administered date required'),
  nextDueDate: z.string().optional().or(z.literal('')),
});

function toDate(s) {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d) ? null : d;
}

// --- POST /api/vaccinations --- Create
router.post('/', async (req, res) => {
  try {
    const data = vaccinationSchema.parse(req.body);

    // Verify animal exists
    const animal = await prisma.animal.findUnique({ where: { id: data.animalId } });
    if (!animal) return res.status(400).json({ error: 'Animal not found' });

    // Check duplicate clientUuid (offline idempotency)
    const existing = await prisma.vaccination.findUnique({
      where: { clientUuid: data.clientUuid },
    });
    if (existing) return res.status(200).json(existing);

    const adminDate = toDate(data.administeredDate);
    if (!adminDate) {
      return res.status(400).json({ error: 'Invalid administered date' });
    }

    // Default next due: +1 year (editable on frontend)
    let nextDue = toDate(data.nextDueDate);
    if (!nextDue) {
      nextDue = new Date(adminDate);
      nextDue.setFullYear(nextDue.getFullYear() + 1);
    }

    const vaccination = await prisma.vaccination.create({
      data: {
        clientUuid: data.clientUuid,
        animalId: data.animalId,
        vaccineType: data.vaccineType,
        batchNo: data.batchNo || null,
        manufacturer: data.manufacturer || null,
        expiryDate: toDate(data.expiryDate),
        stickerQr: data.stickerQr || null,
        administeredDate: adminDate,
        nextDueDate: nextDue,
        vetId: req.user.userId,
      },
      include: {
        animal: {
          select: {
            id: true,
            name: true,
            species: { select: { name: true } },
            currentOwner: { select: { fullName: true } },
          },
        },
      },
    });

    res.status(201).json(vaccination);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    console.error('Create vaccination error:', err);
    res.status(500).json({ error: 'Failed to create vaccination' });
  }
});

// --- GET /api/vaccinations --- List with filters
router.get('/', async (req, res) => {
  try {
    const { search = '', filter = 'all', page = '1', limit = '20' } = req.query;
    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const today = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const where = {};

    if (search) {
      where.OR = [
        { batchNo: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { animal: { name: { contains: search, mode: 'insensitive' } } },
        { animal: { currentOwner: { fullName: { contains: search, mode: 'insensitive' } } } },
        { animal: { microchip: { chipNumber: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    if (filter === 'overdue') {
      where.nextDueDate = { lt: today };
    } else if (filter === 'due-soon') {
      where.nextDueDate = { gte: today, lte: in30Days };
    }

    const [vaccinations, total] = await Promise.all([
      prisma.vaccination.findMany({
        where,
        orderBy: { administeredDate: 'desc' },
        skip,
        take,
        include: {
          animal: {
            select: {
              id: true,
              name: true,
              breed: true,
              species: { select: { name: true } },
              currentOwner: { select: { fullName: true, phone: true } },
            },
          },
        },
      }),
      prisma.vaccination.count({ where }),
    ]);

    res.json({
      data: vaccinations,
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    console.error('List vaccinations error:', err);
    res.status(500).json({ error: 'Failed to list vaccinations' });
  }
});

// --- GET /api/vaccinations/:id --- Single
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const v = await prisma.vaccination.findUnique({
      where: { id },
      include: {
        animal: {
          include: {
            species: true,
            currentOwner: true,
          },
        },
      },
    });

    if (!v) return res.status(404).json({ error: 'Vaccination not found' });
    res.json(v);
  } catch (err) {
    console.error('Get vaccination error:', err);
    res.status(500).json({ error: 'Failed to get vaccination' });
  }
});

// --- PUT /api/vaccinations/:id --- Update
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const data = vaccinationSchema.partial().parse(req.body);

    const updateData = {
      vaccineType: data.vaccineType,
      batchNo: data.batchNo ?? undefined,
      manufacturer: data.manufacturer ?? undefined,
      expiryDate: data.expiryDate ? toDate(data.expiryDate) : undefined,
      stickerQr: data.stickerQr ?? undefined,
      administeredDate: data.administeredDate
        ? toDate(data.administeredDate)
        : undefined,
      nextDueDate: data.nextDueDate ? toDate(data.nextDueDate) : undefined,
    };

    const v = await prisma.vaccination.update({
      where: { id },
      data: updateData,
      include: {
        animal: { select: { id: true, name: true } },
      },
    });

    res.json(v);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Vaccination not found' });
    }
    console.error('Update vaccination error:', err);
    res.status(500).json({ error: 'Failed to update vaccination' });
  }
});

// --- DELETE /api/vaccinations/:id --- Delete (with restrictions)
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const vaccination = await prisma.vaccination.findUnique({ where: { id } });
    if (!vaccination) return res.status(404).json({ error: 'Vaccination not found' });

    const isCreator = vaccination.vetId === req.user.userId;
    const isAdmin = ['DAPH_OFFICER', 'SUPER_ADMIN'].includes(req.user.role);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const isOld =
      Date.now() - new Date(vaccination.createdAt).getTime() > thirtyDaysMs;

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        error: 'Cannot delete vaccination created by another user',
      });
    }

    if (isOld && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error:
          'Vaccinations older than 30 days can only be deleted by SUPER_ADMIN',
      });
    }

    await prisma.vaccination.delete({ where: { id } });
    await removeUpload(vaccination.certificateUrl);
    res.json({ message: 'Vaccination deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Vaccination not found' });
    }
    console.error('Delete vaccination error:', err);
    res.status(500).json({ error: 'Failed to delete vaccination' });
  }
});

// --- POST /api/vaccinations/:id/certificate --- Upload
router.post('/:id/certificate', certificateUpload.single('certificate'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const existing = await prisma.vaccination.findUnique({ where: { id }, select: { certificateUrl: true } });
    if (!existing) return res.status(404).json({ error: 'Vaccination not found' });

    const certificateUrl = await storeUpload(req.file, 'certificates', CERT_TYPES);

    const v = await prisma.vaccination.update({
      where: { id },
      data: { certificateUrl },
    });

    // Replaced certificate: remove the old file (kept 30 days in S3 versioning)
    if (existing.certificateUrl && existing.certificateUrl !== certificateUrl) {
      await removeUpload(existing.certificateUrl);
    }

    res.json({ certificateUrl, vaccination: v });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Vaccination not found' });
    }
    console.error('Certificate upload error:', err);
    res.status(500).json({ error: 'Failed to upload certificate' });
  }
});

module.exports = router;
