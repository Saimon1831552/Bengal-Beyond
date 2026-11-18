import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format";
import { nn, STATUS3 } from "./shared";

export default {
  title: "Blog posts", singular: "post",
  intro: "Archiving hides a post from the site (it is not deleted). Edit an archived post to restore it.",
  endpoint: "/blog/admin",
  itemPath: (r) => `/blog/admin/${r.id}`,
  loadRow: async (r, api) => (await api.get(`/blog/admin/${r.id}`)).data.data,   // the list has no body text
  filters: [{ name: "status", label: "Status", type: "select", options: [["", "All statuses"], ...STATUS3] }],
  read: (raw) => ({ rows: raw.data.items, pages: raw.data.pagination.totalPages, total: raw.data.pagination.total }),
  columns: [
    { label: "Post", render: (r) => <><span className="font-semibold text-primary">{r.title}</span><br /><span className="text-xs text-muted">/{r.slug}</span></> },
    { label: "Status", render: (r) => <StatusBadge value={r.status} /> },
    { label: "Published", render: (r) => (r.published_at ? formatDate(r.published_at) : "—") },
    { label: "Updated", render: (r) => formatDate(r.updated_at) },
  ],
  fields: [
    { name: "title", label: "Title", required: true, maxLength: 200, wide: true },
    { name: "slug", label: "Slug", required: true, maxLength: 220, pattern: "[a-z0-9]+(-[a-z0-9]+)*", autoSlug: "title" },
    { name: "status", label: "Status", type: "select", options: STATUS3, default: "draft" },
    { name: "excerpt", label: "Excerpt", type: "textarea", rows: 2, maxLength: 500, wide: true },
    { name: "content", label: "Content", type: "textarea", rows: 14, required: true, wide: true, hint: "Plain text for now. If you ever render this as HTML on the site, sanitize it first." },
    { name: "featured_image_url", label: "Featured image URL", type: "url", maxLength: 1024, wide: true },
    { name: "featured_image_alt", label: "Image description (alt text)", maxLength: 255, wide: true },
    { name: "seo_title", label: "SEO title", maxLength: 200 },
    { name: "seo_description", label: "SEO description", maxLength: 320 },
  ],
  toForm: (r) => ({ title: r.title, slug: r.slug, status: r.status, excerpt: r.excerpt ?? "", content: r.content ?? "", featured_image_url: r.featured_image_url ?? "",
    featured_image_alt: r.featured_image_alt ?? "", seo_title: r.seo_title ?? "", seo_description: r.seo_description ?? "" }),
  toPayload: (v) => ({ title: v.title.trim(), slug: v.slug.trim(), status: v.status, excerpt: nn(v.excerpt), content: v.content, featured_image_url: nn(v.featured_image_url),
    featured_image_alt: nn(v.featured_image_alt), seo_title: nn(v.seo_title), seo_description: nn(v.seo_description) }),
  remove: { label: "Archive", confirm: (r) => `Archive "${r.title}"? It disappears from the site.` },
};