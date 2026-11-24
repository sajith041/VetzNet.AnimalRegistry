const express = require('express');
const prisma = require('../config/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');
const { format } = require("date-fns");

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('DAPH_OFFICER', 'SUPER_ADMIN'));

// GET /api/reports/overdue
router.get('/overdue', async (req, res) => {
  try {
    const now = new Date();
    const rows = await prisma.vaccination.findMany({
      where: { nextDueDate: { lt: now } },
      orderBy: { nextDueDate: 'asc' },
      include: {
        animal: {
          select: {
            id: true,
            name: true,
            breed: true,
            species: { select: { name: true } },
            currentOwner: {
              select: { fullName: true, phone: true, district: true },
            },
            microchip: { select: { chipNumber: true } },
          },
        },
      },
    });

    const enriched = rows.map((v) => {
      const daysOverdue = Math.floor(
        (now - new Date(v.nextDueDate)) / (1000 * 60 * 60 * 24)
      );
      return {
        vaccinationId: v.id,
        animalId: v.animal?.id,
        animalName: v.animal?.name || 'Unnamed',
        species: v.animal?.species?.name,
        breed: v.animal?.breed,
        chipNumber: v.animal?.microchip?.chipNumber,
        ownerName: v.animal?.currentOwner?.fullName,
        ownerPhone: v.animal?.currentOwner?.phone,
        district: v.animal?.currentOwner?.district,
        vaccineType: v.vaccineType,
        administeredDate: v.administeredDate,
        nextDueDate: v.nextDueDate,
        daysOverdue,
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Overdue report error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/reports/chip-compliance
router.get('/chip-compliance', async (req, res) => {
  try {
    const rows = await prisma.animal.findMany({
      where: {
        status: 'ACTIVE',
        chipRequirement: 'REQUIRED',
        microchip: null,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        species: { select: { name: true } },
        currentOwner: {
          select: { fullName: true, phone: true, district: true },
        },
      },
    });

    const enriched = rows.map((a) => ({
      animalId: a.id,
      animalName: a.name || 'Unnamed',
      species: a.species?.name,
      breed: a.breed,
      ownerName: a.currentOwner?.fullName,
      ownerPhone: a.currentOwner?.phone,
      district: a.currentOwner?.district,
      registeredAt: a.createdAt,
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Chip compliance report error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/reports/coverage
router.get('/coverage', async (req, res) => {
  try {
    const now = new Date();

    const animals = await prisma.animal.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        currentOwner: { select: { district: true } },
        vaccinations: {
          select: { nextDueDate: true },
          orderBy: { administeredDate: 'desc' },
          take: 1,
        },
      },
    });

    const districts = {};
    animals.forEach((a) => {
      const d = a.currentOwner?.district || 'Unknown';
      if (!districts[d]) {
        districts[d] = {
          district: d,
          totalAnimals: 0,
          upToDate: 0,
          overdue: 0,
        };
      }
      districts[d].totalAnimals += 1;
      const latest = a.vaccinations[0];
      if (!latest || !latest.nextDueDate) {
        // Never vaccinated — count as not up to date (not overdue either)
        return;
      }
      if (new Date(latest.nextDueDate) < now) {
        districts[d].overdue += 1;
      } else {
        districts[d].upToDate += 1;
      }
    });

    const arr = Object.values(districts).map((d) => ({
      ...d,
      coveragePct:
        d.totalAnimals > 0
          ? Math.round((d.upToDate / d.totalAnimals) * 1000) / 10
          : 0,
    }));

    arr.sort((a, b) => b.totalAnimals - a.totalAnimals);

    res.json(arr);
  } catch (err) {
    console.error('Coverage report error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.get('/allAnimals', async (req, res) => {
  try {
    const now = new Date();
    const rows = await prisma.animal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
       
            microchip: { select: { chipNumber: true } },
            createdBy: { select: { id: true, username:true,fullName: true } },
            currentOwner: {
              select: { fullName: true, phone: true, district: true },
            },
            species: { select: { name: true } },
          },
        
      
    });

    const enriched = rows.map((a) => {
      return {
        animalId: a?.id,
        animalName: a?.name || 'Unnamed',
        species: a?.species?.name,
        breed: a?.breed,
        chipNumber: a?.microchip?.chipNumber,
        ownerName: a?.currentOwner?.fullName,
        ownerPhone: a?.currentOwner?.phone,
        location: a?.location,
        sterilizationStatus: a.sterilizationStatus,
        createdAt: a.createdAt? format(a.createdAt, "dd/MM/yyyy HH:mm"):"-",
        createdBy:a.createdBy?.fullName?a.createdBy.fullName:a.createdBy.username
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error('Overdue report error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});


module.exports = router;