const express = require('express');
const prisma = require('../config/prisma');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);
router.use(requireRole('DAPH_OFFICER', 'SUPER_ADMIN', 'VET', 'CLINIC_STAFF'));

// GET /api/stats/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Parallel aggregations
    const [
      animalsTotal,
      animalsChipped,
      animalsBySpecies,
      missingRequiredChip,
      ownersTotal,
      ownersOrgs,
      vetsTotal,
      vaccinationsTotal,
      overdueVaccinations,
      dueSoonVaccinations,
      animalsByDistrict,
      animalsThisWeek,
      vaccinationsThisWeek,
      transfersThisWeek,
    ] = await Promise.all([
      prisma.animal.count({ where: { status: 'ACTIVE' } }),
      prisma.animal.count({
        where: { status: 'ACTIVE', microchip: { isNot: null } },
      }),
      prisma.animal.groupBy({
        by: ['speciesId'],
        where: { status: 'ACTIVE' },
        _count: true,
      }),
      prisma.animal.count({
        where: {
          status: 'ACTIVE',
          chipRequirement: 'REQUIRED',
          microchip: null,
        },
      }),
      prisma.owner.count(),
      prisma.owner.count({ where: { ownerType: 'ORGANIZATION' } }),
      prisma.vet.count({ where: { status: 'ACTIVE' } }),
      prisma.vaccination.count(),
      prisma.vaccination.count({
        where: { nextDueDate: { lt: now } },
      }),
      prisma.vaccination.count({
        where: { nextDueDate: { gte: now, lte: in30Days } },
      }),
      prisma.animal.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          currentOwner: { select: { district: true } },
        },
      }),
      prisma.animal.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.vaccination.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.ownershipHistory.count({ where: { transferDate: { gte: sevenDaysAgo } } }),
    ]);

    // Enrich species names
    const speciesIds = animalsBySpecies.map((s) => s.speciesId);
    const speciesList = await prisma.species.findMany({
      where: { id: { in: speciesIds } },
      select: { id: true, name: true },
    });
    const speciesMap = Object.fromEntries(speciesList.map((s) => [s.id, s.name]));
    const speciesBreakdown = animalsBySpecies.map((s) => ({
      name: speciesMap[s.speciesId] || 'Unknown',
      count: s._count,
    }));

    // Aggregate districts
    const districtMap = {};
    animalsByDistrict.forEach((a) => {
      const d = a.currentOwner?.district || 'Unknown';
      if (!districtMap[d]) districtMap[d] = { district: d, animals: 0 };
      districtMap[d].animals += 1;
    });

    // Count overdue per district (join)
    const overdueByDistrict = await prisma.vaccination.findMany({
      where: { nextDueDate: { lt: now } },
      select: {
        animal: {
          select: {
            currentOwner: { select: { district: true } },
          },
        },
      },
    });
    overdueByDistrict.forEach((v) => {
      const d = v.animal?.currentOwner?.district || 'Unknown';
      if (!districtMap[d]) districtMap[d] = { district: d, animals: 0 };
      districtMap[d].overdue = (districtMap[d].overdue || 0) + 1;
    });

    const districtArr = Object.values(districtMap).sort(
      (a, b) => b.animals - a.animals
    );

    const upToDate = vaccinationsTotal - overdueVaccinations - dueSoonVaccinations;

    res.json({
      animals: {
        total: animalsTotal,
        chipped: animalsChipped,
        chipCoveragePct:
          animalsTotal > 0
            ? Math.round((animalsChipped / animalsTotal) * 1000) / 10
            : 0,
        missingRequiredChip,
        bySpecies: speciesBreakdown,
      },
      vaccinations: {
        total: vaccinationsTotal,
        upToDate,
        dueSoon: dueSoonVaccinations,
        overdue: overdueVaccinations,
        overduePct:
          vaccinationsTotal > 0
            ? Math.round((overdueVaccinations / vaccinationsTotal) * 1000) / 10
            : 0,
      },
      owners: { total: ownersTotal, organizations: ownersOrgs },
      vets: { total: vetsTotal },
      byDistrict: districtArr,
      recentActivity: {
        animalsThisWeek,
        vaccinationsThisWeek,
        transfersThisWeek,
      },
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

module.exports = router;