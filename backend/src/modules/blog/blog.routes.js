const express = require("express");
const { z } = require("zod");
const asyncHandler = require("../../utils/asynchandler");
const { sendSuccess } = require("../../utils/response");
const service = require("./blog.service");

const router = express.Router();
const idSchema = z.coerce.number().int().positive();
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});
const statusSchema = z.enum(["draft", "published", "archived"]);
const postSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(1).max(220).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().trim().max(500).nullable().optional(),
  content: z.string().min(1),
  featured_image_url: z.string().trim().url().max(1024).nullable().optional(),
  featured_image_alt: z.string().trim().max(255).nullable().optional(),
  status: statusSchema.optional(),
  seo_title: z.string().trim().max(200).nullable().optional(),
  seo_description: z.string().trim().max(320).nullable().optional()
});
const patchSchema = postSchema.partial();

function createBlogRouter({ authenticate, authorize }) {
  if (typeof authenticate !== "function" || typeof authorize !== "function") {
    throw new Error("Blog router requires the application's real authenticate and authorize middleware");
  }

  // Public routes: intentionally do not use authentication middleware.
  router.get("/", asyncHandler(async (req, res) => {
    const q = paginationSchema.parse(req.query);
    return sendSuccess(res, await service.listPublic(q));
  }));
  router.get("/:slug", asyncHandler(async (req, res) => {
    const slug = z.string().min(1).max(220).parse(req.params.slug);
    const post = await service.getPublicBySlug(slug);
    if (!post) return res.status(404).json({ success: false, error: { code: "BLOG_POST_NOT_FOUND", message: "Blog post not found" } });
    return sendSuccess(res, post);
  }));

  const admin = express.Router();
  admin.use(authenticate, authorize("content.manage"));
  admin.get("/", asyncHandler(async (req, res) => {
    const q = paginationSchema.parse(req.query);
    const status = req.query.status === undefined ? undefined : statusSchema.parse(req.query.status);
    return sendSuccess(res, await service.listAdmin({ ...q, status }));
  }));
  admin.post("/", asyncHandler(async (req, res) => {
    const data = postSchema.parse(req.body);
    return sendSuccess(res, await service.create(data, req.user?.id), { status: 201 });
  }));
  admin.patch("/:id", asyncHandler(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const data = patchSchema.parse(req.body);
    const post = await service.update(id, data);
    if (!post) return res.status(404).json({ success: false, error: { code: "BLOG_POST_NOT_FOUND", message: "Blog post not found" } });
    return sendSuccess(res, post);
  }));
  admin.delete("/:id", asyncHandler(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    if (!(await service.archive(id))) return res.status(404).json({ success: false, error: { code: "BLOG_POST_NOT_FOUND", message: "Blog post not found" } });
    return sendSuccess(res, { id, archived: true });
  }));
  router.use("/admin", admin);
  return router;
}

module.exports = { createBlogRouter };
