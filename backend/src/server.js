require('dotenv').config();
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const animalRoutes = require('./routes/animals');
const vaccinationRoutes = require('./routes/vaccinations');
const userRoutes = require('./routes/users');
const vetRoutes = require('./routes/vets');
const statsRoutes = require('./routes/stats');
const reportsRoutes = require('./routes/reports');

const authRoutes = require('./routes/auth');
const ownerRoutes = require('./routes/owners');
const speciesRoutes = require('./routes/species');
const { requireAuth } = require('./middleware/auth');
const { uploadErrorHandler, LOCAL_DIR } = require('./config/multer');

const app = express();
app.use(cors());
// Serve locally stored uploads at /uploads/* (local dev only; in AWS CloudFront serves them from S3)
app.use('/uploads', express.static(LOCAL_DIR));
app.use(express.json());

// Only accept /api requests that came through CloudFront. CloudFront adds this secret header;
// calls straight to the API Gateway URL don't have it. Skipped locally (variable not set).
const originSecret = Buffer.from(process.env.ORIGIN_VERIFY_SECRET || '');
app.use('/api', (req, res, next) => {
  if (originSecret.length === 0) return next();
  const given = Buffer.from(req.get('x-origin-verify') || '');
  if (given.length === originSecret.length && crypto.timingSafeEqual(given, originSecret)) return next();
  return res.status(403).json({ error: 'Forbidden' });
});

// --- Public routes ---
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/species', speciesRoutes);
app.use('/api/animals', animalRoutes);
app.use('/api/vaccinations', vaccinationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vets', vetRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/reports', reportsRoutes);

// --- Protected test route ---
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// --- Error handlers ---
app.use(uploadErrorHandler); // wrong file type / too large -> 400
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Backend running at http://localhost:${PORT}`);
});