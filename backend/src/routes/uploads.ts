import multer from 'multer';
import { router, asyncHandler } from '../utils/asyncHandler.js';
import { requireAuth } from '../middleware/auth.js';
import { processImage, deleteImagePaths } from '../services/imagePipeline.js';
import { UploadQuerySchema } from '../schemas/index.js';
import { BadRequestError } from '../utils/errors.js';
import { env } from '../env.js';
import { z } from 'zod';

const r = router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_UPLOAD_BYTES,
    files: 12,
  },
});

/* POST /api/uploads/image — single file w polu "file" */
r.post(
  '/image',
  requireAuth,
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new BadRequestError('Brak pliku w polu "file".');
    const q = UploadQuerySchema.parse({
      ...req.query,
      ...(req.body && typeof req.body === 'object' ? req.body : {}),
    });

    const result = await processImage(req.file.buffer, {
      folder: q.folder,
      alt: q.alt,
      uploaderId: req.user?.id,
    });
    res.status(201).json(result);
  }),
);

/* POST /api/uploads/images — multi (do 12) w polu "files[]" */
r.post(
  '/images',
  requireAuth,
  upload.array('files', 12),
  asyncHandler(async (req, res) => {
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    if (files.length === 0) throw new BadRequestError('Brak plików w polu "files".');
    const q = UploadQuerySchema.parse({ ...req.query });

    // Sekwencyjnie — sharp jest CPU-bound.
    const out = [];
    for (const f of files) {
      out.push(
        await processImage(f.buffer, {
          folder: q.folder,
          alt: q.alt,
          uploaderId: req.user?.id,
        }),
      );
    }
    res.status(201).json({ items: out });
  }),
);

/* DELETE /api/uploads/image — body: { paths: ["gallery/...", "cover/..."] } */
const DeleteSchema = z.object({
  paths: z.array(z.string().min(1)).min(1).max(100),
});
r.delete(
  '/image',
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = DeleteSchema.parse(req.body);
    const result = await deleteImagePaths(body.paths);
    res.json({ ok: true, ...result });
  }),
);

export default r;
