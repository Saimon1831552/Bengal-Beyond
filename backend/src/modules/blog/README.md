# Bengal Beyond — Phase 6.2 Blog API

Backend-only Blog API package. Its migration extends the existing `blog_posts` table without removing existing posts or changing other tables.

## Features
- Public paginated list of published posts
- Public post details by slug
- Admin list with status filtering
- Admin create and update
- Draft, published, and archived states
- Admin delete performs a soft archive
- Zod validation
- Admin routes require real authentication and `content.manage`

## Install
1. Copy `src/modules/blog/` into your backend's `src/modules/blog/`.
2. Run `database/migrations/0062_create_blog_posts.sql` against `bengalbeyond` before starting the API. This adds the image and SEO columns used by the API; existing post content and authors remain in `body` and `author_user_id`.
3. Add this to `src/routes/index.js` (reuse existing imports if present):

```js
const { createBlogRouter } = require("../modules/blog/blog.routes");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");
router.use("/blog", createBlogRouter({ authenticate, authorize }));
```

4. Restart the API.

## Endpoints
Public:
- `GET /api/blog?page=1&limit=20`
- `GET /api/blog/:slug`

Admin (Bearer token + `content.manage`):
- `GET /api/blog/admin?page=1&limit=20&status=draft`
- `POST /api/blog/admin`
- `PATCH /api/blog/admin/:id`
- `DELETE /api/blog/admin/:id` (soft-archives the post)

## Create example
```json
{
  "title": "A weekend in Sundarbans",
  "slug": "a-weekend-in-sundarbans",
  "excerpt": "A short guide to planning a responsible visit.",
  "content": "<p>Article body...</p>",
  "featured_image_url": "https://example.com/images/sundarbans.jpg",
  "featured_image_alt": "Mangrove forest in the Sundarbans",
  "status": "draft",
  "seo_title": "Sundarbans travel guide",
  "seo_description": "Plan a responsible trip to the Sundarbans."
}
```

## Important notes
- `content` is stored as text/HTML. Sanitize HTML before rendering it in a browser; this API does not include an HTML sanitizer.
- Images are referenced by URL; file upload/storage integration is not included.
- Slugs must be unique; duplicate slugs will produce a database duplicate-key error.
- Requires the project's existing `express`, `zod`, `mysql2`, async handler, response helper, and DB pool.
- No live database or end-to-end test has been run as part of package generation.
