// File uploads: animal photos and vaccination certificates.
//
// Multer keeps the upload in memory; storeUpload() then saves it:
//   - AWS:   UPLOADS_BUCKET is set (by OpenTofu) -> S3 key "uploads/<subfolder>/<name>",
//            served by CloudFront at https://<site>/uploads/<subfolder>/<name>
//   - Local: UPLOADS_BUCKET unset -> ./uploads/<subfolder>/<name> on disk (served by express.static)
// Both return the same URL shape as before ("/uploads/<name>", "/uploads/certificates/<name>"),
// so existing database values and the frontend keep working.
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const BUCKET = process.env.UPLOADS_BUCKET;
const LOCAL_DIR = path.join(__dirname, '..', '..', 'uploads');
const s3 = BUCKET ? new S3Client({ region: process.env.AWS_REGION }) : null;

// Real file type, decided from the first bytes of the file. The browser-supplied type
// (file.mimetype) can be faked, so it's only used as a first filter.
const SIGNATURES = [
  { mime: 'image/jpeg', ext: '.jpg', match: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { mime: 'image/png', ext: '.png', match: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { mime: 'image/webp', ext: '.webp', match: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
  { mime: 'application/pdf', ext: '.pdf', match: (b) => b.subarray(0, 5).toString('latin1') === '%PDF-' },
];

function detectType(buffer) {
  if (!buffer || buffer.length < 12) return null;
  return SIGNATURES.find((s) => s.match(buffer)) || null;
}

function badRequest(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function makeUpload(allowed, maxBytes, message) {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
      allowed.includes(file.mimetype) ? cb(null, true) : cb(badRequest(message));
    },
    limits: { fileSize: maxBytes, files: 1 },
  });
}

// Images only — used for animal photos
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const photoUpload = makeUpload(PHOTO_TYPES, 5 * 1024 * 1024, 'Only JPEG, PNG, and WebP images allowed');

// PDFs and images — used for vaccination certificates
// (10 MB is also API Gateway's maximum request size)
const CERT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const certificateUpload = makeUpload(CERT_TYPES, 9.5 * 1024 * 1024, 'Only PDF or image files allowed');

/**
 * Save an uploaded file (req.file) and return its public URL path.
 * @param {object} file       req.file from photoUpload / certificateUpload
 * @param {string} subfolder  '' for photos, 'certificates' for certificates
 * @param {string[]} allowed  allowed MIME types (checked against the file's real content)
 */
async function storeUpload(file, subfolder, allowed) {
  const type = detectType(file.buffer);
  if (!type || !allowed.includes(type.mime)) {
    throw badRequest('File content does not match an allowed type');
  }

  const name = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${type.ext}`;
  const relative = subfolder ? `${subfolder}/${name}` : name;

  if (s3) {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: `uploads/${relative}`,
      Body: file.buffer,
      ContentType: type.mime,
      CacheControl: 'public, max-age=31536000, immutable', // names are unique, never overwritten
    }));
  } else {
    const target = path.join(LOCAL_DIR, relative);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, file.buffer);
  }
  return `/uploads/${relative}`;
}

/**
 * Delete a stored file by its URL path ("/uploads/..."). Best effort: never throws.
 * Ignores empty values and anything that isn't a plain path under /uploads/.
 */
async function removeUpload(urlPath) {
  if (typeof urlPath !== 'string' || !/^\/uploads\/[A-Za-z0-9._/-]+$/.test(urlPath) || urlPath.includes('..')) {
    return;
  }
  const relative = urlPath.slice('/uploads/'.length);
  try {
    if (s3) {
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: `uploads/${relative}` }));
    } else {
      await fs.rm(path.join(LOCAL_DIR, relative), { force: true });
    }
  } catch (err) {
    console.error('Failed to delete upload', urlPath, err.message);
  }
}

/**
 * Express error handler for upload errors (wrong type, too large).
 * Register after the routes in server.js.
 */
function uploadErrorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const error = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large' : err.message;
    return res.status(400).json({ error });
  }
  if (err && err.status === 400) return res.status(400).json({ error: err.message });
  return next(err);
}

module.exports = {
  photoUpload,
  certificateUpload,
  storeUpload,
  removeUpload,
  uploadErrorHandler,
  PHOTO_TYPES,
  CERT_TYPES,
  LOCAL_DIR,
};
