const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const blogService = require("../../src/modules/blog/blog.service");
const { createBlogRouter } = require("../../src/modules/blog/blog.routes");
const galleryService = require("../../src/modules/gallery/gallery.service");
const { createGalleryRouter } = require("../../src/modules/gallery/gallery.routes");

async function request(router, mountPath, routePath) {
  const app = express();
  app.use(mountPath, router);
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${mountPath}${routePath}`);
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("blog and gallery admin GET routes precede public slug and id routes", async (t) => {
  const originalBlogListAdmin = blogService.listAdmin;
  const originalBlogGetAdminById = blogService.getAdminById;
  const originalGalleryListAdmin = galleryService.listAdmin;
  t.after(() => {
    blogService.listAdmin = originalBlogListAdmin;
    blogService.getAdminById = originalBlogGetAdminById;
    galleryService.listAdmin = originalGalleryListAdmin;
  });
  blogService.listAdmin = async () => [{ id: 1, title: "Admin blog list" }];
  blogService.getAdminById = async (id) => ({ id, title: "Admin blog post", content: "Full post body" });
  galleryService.listAdmin = async () => [{ id: 1, title: "Admin gallery list" }];

  const middleware = (_req, _res, next) => next();
  const authorize = () => middleware;
  const blogRouter = createBlogRouter({ authenticate: middleware, authorize });
  const galleryRouter = createGalleryRouter({ authenticate: middleware, authorize });

  const blog = await request(blogRouter, "/blog", "/admin");
  const blogPost = await request(blogRouter, "/blog", "/admin/7");
  const gallery = await request(galleryRouter, "/gallery", "/admin");

  assert.equal(blog.status, 200);
  assert.deepEqual(blog.body.data, [{ id: 1, title: "Admin blog list" }]);
  assert.equal(blogPost.status, 200);
  assert.deepEqual(blogPost.body.data, { id: 7, title: "Admin blog post", content: "Full post body" });
  assert.equal(gallery.status, 200);
  assert.deepEqual(gallery.body.data, [{ id: 1, title: "Admin gallery list" }]);
});
