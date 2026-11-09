const { pool } = require("../../config/db");

async function listPublic({ page, limit }) {
  const offset = (page - 1) * limit;
  const [items] = await pool.execute(
    `SELECT id, title, slug, excerpt, featured_image_url, featured_image_alt,
            seo_title, seo_description, published_at, created_at
       FROM blog_posts WHERE status = 'published'
      ORDER BY published_at DESC, id DESC LIMIT ? OFFSET ?`, [limit, offset]
  );
  const [[count]] = await pool.execute("SELECT COUNT(*) AS total FROM blog_posts WHERE status = 'published'");
  const total = Number(count.total);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getPublicBySlug(slug) {
  const [rows] = await pool.execute(
    `SELECT id, title, slug, excerpt, content, featured_image_url, featured_image_alt,
            seo_title, seo_description, published_at, created_at
       FROM blog_posts WHERE slug = ? AND status = 'published' LIMIT 1`, [slug]
  );
  return rows[0] || null;
}

async function listAdmin({ page, limit, status }) {
  const offset = (page - 1) * limit;
  const where = status ? "WHERE status = ?" : "";
  const params = status ? [status, limit, offset] : [limit, offset];
  const countParams = status ? [status] : [];
  const [items] = await pool.execute(
    `SELECT id, title, slug, excerpt, featured_image_url, featured_image_alt, status,
            seo_title, seo_description, author_id, published_at, created_at, updated_at
       FROM blog_posts ${where} ORDER BY updated_at DESC, id DESC LIMIT ? OFFSET ?`, params
  );
  const [[count]] = await pool.execute(`SELECT COUNT(*) AS total FROM blog_posts ${where}`, countParams);
  const total = Number(count.total);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getAdminById(id) {
  const [rows] = await pool.execute("SELECT * FROM blog_posts WHERE id = ? LIMIT 1", [id]);
  return rows[0] || null;
}

async function create(data, authorId) {
  const publishedAt = data.status === "published" ? new Date() : null;
  const [result] = await pool.execute(
    `INSERT INTO blog_posts (title, slug, excerpt, content, featured_image_url, featured_image_alt,
      status, seo_title, seo_description, author_id, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [data.title, data.slug, data.excerpt ?? null, data.content, data.featured_image_url ?? null,
     data.featured_image_alt ?? null, data.status || "draft", data.seo_title ?? null,
     data.seo_description ?? null, authorId || null, publishedAt]
  );
  return getAdminById(result.insertId);
}

async function update(id, data) {
  const current = await getAdminById(id);
  if (!current) return null;
  const next = { ...current, ...data };
  let publishedAt = current.published_at;
  if (data.status === "published" && current.status !== "published") publishedAt = new Date();
  if (data.status && data.status !== "published") publishedAt = null;
  await pool.execute(
    `UPDATE blog_posts SET title=?, slug=?, excerpt=?, content=?, featured_image_url=?,
      featured_image_alt=?, status=?, seo_title=?, seo_description=?, published_at=? WHERE id=?`,
    [next.title, next.slug, next.excerpt, next.content, next.featured_image_url,
     next.featured_image_alt, next.status, next.seo_title, next.seo_description, publishedAt, id]
  );
  return getAdminById(id);
}

async function archive(id) {
  const [result] = await pool.execute(
    "UPDATE blog_posts SET status='archived', published_at=NULL WHERE id=?", [id]
  );
  return result.affectedRows > 0;
}

module.exports = { listPublic, getPublicBySlug, listAdmin, create, update, archive };
