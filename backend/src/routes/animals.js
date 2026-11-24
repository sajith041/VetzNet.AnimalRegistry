const express = require('express');
const { z } = require('zod');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');
const { photoUpload, storeUpload, removeUpload, PHOTO_TYPES } = require('../config/multer');

const router = express.Router();

router.use(requireAuth);

// --- Validation schemas ---
const animalSchema = z.object({
  clientUuid: z.string().min(10).max(60),
  name: z.string().max(50).optional().or(z.literal('')),
  speciesId: z.number().int().positive(),
  breed: z.string().max(100).optional().or(z.literal('')),
  dob: z.string().optional().or(z.literal('')),
  sex: z.enum(['MALE', 'FEMALE', 'UNKNOWN']).default('UNKNOWN'),
  color: z.string().max(50).optional().or(z.literal('')),
  currentOwnerId: z.number().int().positive(),
  status: z.enum(['ACTIVE', 'DECEASED', 'TRANSFERRED', 'LOST']).default('ACTIVE'),
  chipRequirement: z.enum(['REQUIRED', 'PROVISIONAL', 'OPTIONAL']).default('REQUIRED'),
  location: z.string().max(100).optional().or(z.literal('')),
  sterilizationStatus: z.string().max(100).optional().or(z.literal('')),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),

});

const microchipSchema = z.object({
  chipNumber: z.string().min(9).max(20),
  implantDate: z.string().optional().or(z.literal('')),
  implantLocation: z.string().max(50).optional().or(z.literal('')),
});

// --- POST /api/animals --- Create
router.post('/', async (req, res) => {
  try {
    const data = animalSchema.parse(req.body);

    // Verify owner exists
    const owner = await prisma.owner.findUnique({
      where: { id: data.currentOwnerId },
    });
    if (!owner) {
      return res.status(400).json({ error: 'Owner not found' });
    }

    // Verify species exists
    const species = await prisma.species.findUnique({
      where: { id: data.speciesId },
    });
    if (!species) {
      return res.status(400).json({ error: 'Species not found' });
    }

    // Check duplicate clientUuid
    const existing = await prisma.animal.findUnique({
      where: { clientUuid: data.clientUuid },
    });
    if (existing) {
      // Idempotent — return existing (offline sync friendly)
      return res.status(200).json(existing);
    }

    const animal = await prisma.animal.create({
      data: {
        clientUuid: data.clientUuid,
        name: data.name || null,
        speciesId: data.speciesId,
        breed: data.breed || null,
        dob: data.dob ? new Date(data.dob) : null,
        sex: data.sex,
        color: data.color || null,
        currentOwnerId: data.currentOwnerId,
        status: data.status,
        chipRequirement: data.chipRequirement,
        location: data.location || null,
        sterilizationStatus: data.sterilizationStatus || null,
        createdById: req.user.userId,
        modifiedById: req.user.userId,
        createdAt: new Date(),
        modifiedAt: new Date(),

        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      },
      include: {
        species: true,
        currentOwner: true,
        microchip: true,
      },
    });

    res.status(201).json(animal);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    console.error('Create animal error:', err);
    res.status(500).json({ error: 'Failed to create animal' });
  }
});

// --- GET /api/animals --- List with filters
router.get('/', async (req, res) => {
  try {
    const { search = '', speciesId, ownerId, page = '1', limit = '20' ,searchCreatedBy,modifiedById} = req.query;
    const take = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = {AND:[]};
    if (search) {
      // where.OR = [
      //   { name: { contains: search, mode: 'insensitive' } },
      //   { breed: { contains: search, mode: 'insensitive' } },
      //   { color: { contains: search, mode: 'insensitive' } },
      //   { microchip: { chipNumber: { contains: search, mode: 'insensitive' } } },
      //   { currentOwner: { fullName: { contains: search, mode: 'insensitive' } } },
      //   { createdBy: { username: { contains: searchCreatedBy, mode: 'insensitive' } } },
      //   { createdBy: { fullName: { contains: searchCreatedBy, mode: 'insensitive' } } },
      // ];

      where.AND.push(
        {
          OR : [
            { name: { contains: search, mode: 'insensitive' } },
            { breed: { contains: search, mode: 'insensitive' } },
            { color: { contains: search, mode: 'insensitive' } },
            { microchip: { chipNumber: { contains: search, mode: 'insensitive' } } },
            { currentOwner: { fullName: { contains: search, mode: 'insensitive' } } },
          ]
        }
      )
    }
    if(searchCreatedBy) {
      where.AND.push(
        {
          OR : [
            { createdBy: { username: { contains: searchCreatedBy, mode: 'insensitive' } } },
            { createdBy: { fullName: { contains: searchCreatedBy, mode: 'insensitive' } } },
          ]
        }
      )
    }

    if (speciesId) where.speciesId = parseInt(speciesId, 10);
    if (ownerId) where.currentOwnerId = parseInt(ownerId, 10);

    const [animals, total] = await Promise.all([
      prisma.animal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          species: true,
          currentOwner: { select: { id: true, fullName: true, phone: true } },
          microchip: { select: { id: true, chipNumber: true, status: true } },
          _count: { select: { vaccinations: true } },
          createdBy: { select: { id: true, username:true,fullName: true } },
          modifiedBy: { select: { id: true, username:true, fullName: true } },
        },
      }),
      prisma.animal.count({ where }),
    ]);

    res.json({
      data: animals,
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        pages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    console.error('List animals error:', err);
    res.status(500).json({ error: 'Failed to list animals' });
  }
});

// --- GET /api/animals/stats/missing-chips --- Dashboard stat
router.get('/stats/missing-chips', async (req, res) => {
  try {
    const [total, missingRequired, missingProvisional] = await Promise.all([
      prisma.animal.count({ where: { status: 'ACTIVE' } }),
      prisma.animal.count({
        where: {
          status: 'ACTIVE',
          chipRequirement: 'REQUIRED',
          microchip: null,
        },
      }),
      prisma.animal.count({
        where: {
          status: 'ACTIVE',
          chipRequirement: 'PROVISIONAL',
          microchip: null,
        },
      }),
    ]);

    res.json({
      totalActive: total,
      missingRequiredChip: missingRequired,
      missingProvisionalChip: missingProvisional,
    });
  } catch (err) {
    console.error('Missing chips stats error:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// --- GET /api/animals/:id --- Detail
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const animal = await prisma.animal.findUnique({
      where: { id },
      include: {
        species: true,
        currentOwner: true,
        microchip: true,
        vaccinations: { orderBy: { administeredDate: 'desc' } },
        ownershipHistory: {
          orderBy: { transferDate: 'desc' },
          include: { fromOwner: true, toOwner: true },
        },
        createdBy: { select: { id: true, username:true,fullName: true } },
        modifiedBy: { select: { id: true, username:true, fullName: true } },
      },
    });

    if (!animal) return res.status(404).json({ error: 'Animal not found' });
    res.json(animal);
  } catch (err) {
    console.error('Get animal error:', err);
    res.status(500).json({ error: 'Failed to get animal' });
  }
});

// --- PUT /api/animals/:id --- Update (owner changes restricted)
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const data = animalSchema.partial().parse(req.body);

    // Load existing animal to check if owner is changing
    const existing = await prisma.animal.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Animal not found' });

    // Block owner changes via edit form
    if (
      data.currentOwnerId !== undefined &&
      data.currentOwnerId !== existing.currentOwnerId
    ) {
      return res.status(403).json({
        error:
          'Cannot change owner via edit form. Use the Transfer Ownership feature to preserve the audit trail.',
      });
    }

    const animal = await prisma.animal.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        speciesId: data.speciesId,
        breed: data.breed ?? undefined,
        dob: data.dob ? new Date(data.dob) : undefined,
        sex: data.sex,
        color: data.color ?? undefined,
        status: data.status,
        chipRequirement: data.chipRequirement,
        // currentOwnerId intentionally NOT updated here
        location: data.location ?? undefined,
        sterilizationStatus: data.sterilizationStatus ?? undefined,
        modifiedById: req.user.userId,
        modifiedAt: new Date(),
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
      },
      include: {
        species: true,
        currentOwner: true,
        microchip: true,
      },
    });

    res.json(animal);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Animal not found' });
    }
    console.error('Update animal error:', err);
    res.status(500).json({ error: 'Failed to update animal' });
  }
});

// --- DELETE /api/animals/:id --- Delete (SUPER_ADMIN only)
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    // Only SUPER_ADMIN can delete animals
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: 'Only SUPER_ADMIN can delete animals',
      });
    }

    const vacCount = await prisma.vaccination.count({ where: { animalId: id } });
    if (vacCount > 0) {
      return res.status(409).json({
        error: `Cannot delete animal with ${vacCount} vaccination record(s)`,
      });
    }

    const [, deleted] = await prisma.$transaction([
      prisma.microchip.deleteMany({ where: { animalId: id } }),
      prisma.animal.delete({ where: { id } }),
    ]);
    await removeUpload(deleted.photoUrl);

    res.json({ message: 'Animal deleted' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Animal not found' });
    }
    console.error('Delete animal error:', err);
    res.status(500).json({ error: 'Failed to delete animal' });
  }
});

// --- POST /api/animals/:id/microchip --- Attach chip
router.post('/:id/microchip', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const data = microchipSchema.parse(req.body);

    // Verify animal exists
    const animal = await prisma.animal.findUnique({ where: { id } });
    if (!animal) return res.status(404).json({ error: 'Animal not found' });

    // Check animal doesn't already have a chip
    const existing = await prisma.microchip.findUnique({ where: { animalId: id } });
    if (existing) {
      return res.status(409).json({ error: 'Animal already has a microchip' });
    }

    // Check chip number uniqueness
    const chipTaken = await prisma.microchip.findUnique({
      where: { chipNumber: data.chipNumber },
    });
    if (chipTaken) {
      return res.status(409).json({ error: 'Chip number already registered' });
    }

    const chip = await prisma.microchip.create({
      data: {
        chipNumber: data.chipNumber,
        implantDate: data.implantDate ? new Date(data.implantDate) : null,
        implantLocation: data.implantLocation || null,
        implantedByVetId: req.user.userId,
        animalId: id,
      },
    });

    res.status(201).json(chip);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    console.error('Attach chip error:', err);
    res.status(500).json({ error: 'Failed to attach microchip' });
  }
});

// --- POST /api/animals/:id/photo --- Upload photo
router.post('/:id/photo', photoUpload.single('photo'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const existing = await prisma.animal.findUnique({ where: { id }, select: { photoUrl: true } });
    if (!existing) return res.status(404).json({ error: 'Animal not found' });

    const photoUrl = await storeUpload(req.file, '', PHOTO_TYPES);

    const animal = await prisma.animal.update({
      where: { id },
      data: { photoUrl },
    });

    // Replaced photo: remove the old file (kept 30 days in S3 versioning)
    if (existing.photoUrl && existing.photoUrl !== photoUrl) await removeUpload(existing.photoUrl);

    res.json({ photoUrl, animal });
  } catch (err) {
    if (err.status === 400) return res.status(400).json({ error: err.message });
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Animal not found' });
    }
    console.error('Photo upload error:', err);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});
// --- POST /api/animals/:id/transfer --- Transfer ownership
const transferSchema = z.object({
  toOwnerId: z.number().int().positive(),
  transferReason: z.string().max(200).optional().or(z.literal('')),
  transferCode: z.string().max(50).optional().or(z.literal('')),
});

router.post('/:id/transfer', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    // Only VET, DAPH_OFFICER, or SUPER_ADMIN can perform transfers
    const allowedRoles = ['VET', 'DAPH_OFFICER', 'SUPER_ADMIN'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You are not allowed to transfer animals' });
    }

    const data = transferSchema.parse(req.body);

    // Load animal with current owner
    const animal = await prisma.animal.findUnique({
      where: { id },
      include: { currentOwner: true },
    });
    if (!animal) return res.status(404).json({ error: 'Animal not found' });

    if (animal.status !== 'ACTIVE') {
      return res.status(409).json({
        error: `Cannot transfer an animal with status ${animal.status}`,
      });
    }

    if (animal.currentOwnerId === data.toOwnerId) {
      return res.status(400).json({ error: 'Animal already owned by this owner' });
    }

    // Verify new owner exists
    const toOwner = await prisma.owner.findUnique({
      where: { id: data.toOwnerId },
    });
    if (!toOwner) return res.status(400).json({ error: 'New owner not found' });

    // Atomic transaction: record history + update animal
    const [history, updated] = await prisma.$transaction([
      prisma.ownershipHistory.create({
        data: {
          animalId: id,
          fromOwnerId: animal.currentOwnerId,
          toOwnerId: data.toOwnerId,
          transferReason: data.transferReason || null,
          approvedByUserId: req.user.userId,
          method: data.transferCode ? 'CODE' : 'DIRECT',
          transferCode: data.transferCode || null,
        },
        include: {
          fromOwner: { select: { id: true, fullName: true } },
          toOwner: { select: { id: true, fullName: true } },
        },
      }),
      prisma.animal.update({
        where: { id },
        data: { currentOwnerId: data.toOwnerId },
        include: {
          species: true,
          currentOwner: true,
          microchip: true,
        },
      }),
    ]);

    res.status(201).json({ history, animal: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: err.errors });
    }
    console.error('Transfer error:', err);
    res.status(500).json({ error: 'Failed to transfer ownership' });
  }
});

// --- GET /api/animals/:id/history --- Ownership history
router.get('/:id/history', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const history = await prisma.ownershipHistory.findMany({
      where: { animalId: id },
      orderBy: { transferDate: 'desc' },
      include: {
        fromOwner: { select: { id: true, fullName: true, ownerType: true } },
        toOwner: { select: { id: true, fullName: true, ownerType: true } },
      },
    });

    res.json(history);
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to get ownership history' });
  }
});
// --- GET /api/animals/stats/missing-chips --- Dashboard stat
router.get('/stats/missing-chips', async (req, res) => {
  try {
    const [total, missingRequired, missingProvisional] = await Promise.all([
      prisma.animal.count({ where: { status: 'ACTIVE' } }),
      prisma.animal.count({
        where: {
          status: 'ACTIVE',
          chipRequirement: 'REQUIRED',
          microchip: null,
        },
      }),
      prisma.animal.count({
        where: {
          status: 'ACTIVE',
          chipRequirement: 'PROVISIONAL',
          microchip: null,
        },
      }),
    ]);

    res.json({
      totalActive: total,
      missingRequiredChip: missingRequired,
      missingProvisionalChip: missingProvisional,
    });
  } catch (err) {
    console.error('Missing chips stats error:', err);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// --- PUT /api/animals/:id/microchip --- Change (or add) the chip number
const chipNumberSchema = z.object({ chipNumber: z.string().trim().min(9).max(20) });

router.put('/:id/microchip', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' });

    const { chipNumber } = chipNumberSchema.parse(req.body);

    const animal = await prisma.animal.findUnique({ where: { id }, include: { microchip: true } });
    if (!animal) return res.status(404).json({ error: 'Animal not found' });

    const current = animal.microchip;
    if (current && current.chipNumber === chipNumber) return res.json(current); // unchanged

    const taken = await prisma.microchip.findUnique({ where: { chipNumber } });
    if (taken) return res.status(409).json({ error: 'Chip number already registered to another animal' });

    const chip = current
      ? await prisma.microchip.update({ where: { id: current.id }, data: { chipNumber } })
      : await prisma.microchip.create({
          data: { chipNumber, implantedByVetId: req.user.userId, animalId: id },
        });

    console.log(`Chip number changed: animal ${id}, ${current?.chipNumber ?? '(none)'} -> ${chipNumber}, by user ${req.user.userId}`);
    res.json(chip);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Chip number must be 9–20 characters', details: err.issues });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Chip number already registered to another animal' });
    }
    console.error('Update chip error:', err);
    res.status(500).json({ error: 'Failed to update microchip' });
  }
});

module.exports = router;
