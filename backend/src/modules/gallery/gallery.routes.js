const express = require('express');
const { z } = require('zod');
const asyncHandler = require('../../utils/asynchandler');
const { sendSuccess } = require('../../utils/response');
const service = require('./gallery.service');

const idSchema = z.coerce.number().int().positive();
const pagination = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });
const itemSchema = z.object({
  tour_id: z.number().int().positive().nullable().optional(),
  title: z.string().trim().max(200).nullable().optional(),
  media_url: z.string().trim().url().max(1024),
  alt_text: z.string().trim().max(255).nullable().optional(),
  sort_order: z.number().int().min(-2147483648).max(2147483647).optional(),
  status: z.enum(['draft','published','archived']).optional()
});
const patchSchema = itemSchema.partial();
const statuses = ['draft','published','archived'];

// Inject the application's real auth and RBAC middleware. No fake auth is provided.
function createGalleryRouter({ authenticate, authorize }) {
  if (typeof authenticate !== 'function' || typeof authorize !== 'function') {
    throw new Error('Gallery router requires real requireAuth and requirePermission middleware');
  }
  const router = express.Router();

  // Public gallery: published items only.
  router.get('/', asyncHandler(async (req, res) => {
    const q = pagination.parse(req.query);
    const tourId = req.query.tour_id === undefined ? undefined : idSchema.parse(req.query.tour_id);
    return sendSuccess(res, await service.listPublic({ ...q, tourId }));
  }));
  router.get('/:id', asyncHandler(async (req, res) => {
    const id = idSchema.parse(req.params.id); const item = await service.getById(id);
    if (!item || item.status !== 'published') return res.status(404).json({ success:false, error:{ code:'GALLERY_ITEM_NOT_FOUND', message:'Gallery item not found' } });
    return sendSuccess(res, item);
  }));

  // Admin endpoints. Mount this router at /gallery; protect /admin separately in the route index below.
  const admin = express.Router();
  admin.use(authenticate, authorize('content.manage'));
  admin.get('/', asyncHandler(async (req,res) => {
    const q = pagination.parse(req.query);
    const status = req.query.status === undefined ? undefined : z.enum(statuses).parse(req.query.status);
    const tourId = req.query.tour_id === undefined ? undefined : idSchema.parse(req.query.tour_id);
    return sendSuccess(res, await service.listAdmin({ ...q, status, tourId }));
  }));
  admin.post('/', asyncHandler(async (req,res) => {
    const data = itemSchema.parse(req.body);
    const item = await service.create(data, req.user?.id);
    return sendSuccess(res, item, { status:201 });
  }));
  admin.patch('/:id', asyncHandler(async (req,res) => {
    const id = idSchema.parse(req.params.id); const data = patchSchema.parse(req.body);
    const item = await service.update(id, data);
    if (!item) return res.status(404).json({ success:false, error:{ code:'GALLERY_ITEM_NOT_FOUND', message:'Gallery item not found' } });
    return sendSuccess(res, item);
  }));
  admin.delete('/:id', asyncHandler(async (req,res) => {
    const id = idSchema.parse(req.params.id);
    if (!(await service.remove(id))) return res.status(404).json({ success:false, error:{ code:'GALLERY_ITEM_NOT_FOUND', message:'Gallery item not found' } });
    return sendSuccess(res, { id, deleted:true });
  }));
  router.use('/admin', admin);
  return router;
}
module.exports = { createGalleryRouter };
