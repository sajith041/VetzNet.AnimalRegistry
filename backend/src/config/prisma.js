// src/config/prisma.js — Prisma client using the node-postgres driver adapter.
//
// DATABASE_URL comes from SSM (set by OpenTofu) in AWS, and from .env locally.
// The URL keeps "sslmode=require" because the Prisma CLI (migrate) needs it, but node-postgres
// would let URL settings override the ssl options below, so we strip them before connecting
// and configure TLS explicitly:
//   - In the Docker image, the Amazon RDS CA bundle is at /app/certs/rds-global-bundle.pem,
//     so the server certificate is fully verified.
//   - Locally without that file, SSL is only used if the URL asks for it.
const fs = require('node:fs');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

const RDS_CA_PATH = process.env.DB_CA_PATH || '/app/certs/rds-global-bundle.pem';

function poolConfig() {
  const url = new URL(process.env.DATABASE_URL);
  const sslMode = url.searchParams.get('sslmode');
  const connectTimeoutSec = Number(url.searchParams.get('connect_timeout') || 30);

  // Remove params node-postgres would otherwise apply on top of our settings.
  url.searchParams.delete('sslmode');
  url.searchParams.delete('connect_timeout');

  let ssl = false;
  if (fs.existsSync(RDS_CA_PATH)) {
    ssl = { ca: fs.readFileSync(RDS_CA_PATH, 'utf8'), rejectUnauthorized: true };
  } else if (sslMode && sslMode !== 'disable') {
    ssl = { rejectUnauthorized: false }; // encrypted, CA not verified (local use only)
  }

  return {
    connectionString: url.toString(),
    ssl,
    max: 5,
    idleTimeoutMillis: 5 * 60 * 1000,
    // A paused Aurora Serverless database takes ~15 s to wake up.
    connectionTimeoutMillis: connectTimeoutSec * 1000,
  };
}

const adapter = new PrismaPg(poolConfig());
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
