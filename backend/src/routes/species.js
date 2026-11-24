const express = require('express');
const prisma = require('../config/prisma');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// GET /api/species — list all active species
router.get('/', async (req, res) => {
  try {
    const species = await prisma.species.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        nameSi: true,
        nameTa: true,
      },
    });
    res.json(species);
  } catch (err) {
    console.error('List species error:', err);
    res.status(500).json({ error: 'Failed to list species' });
  }
});

module.exports = router;