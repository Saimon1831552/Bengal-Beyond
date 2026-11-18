import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format";
import { nn, STATUS3 } from "./shared";

export default {
  title: "Destinations", singular: "destination",
  intro: "Only published destinations appear on the site. Public pages refresh within an hour.",
  endpoint: "/admin/destinations",
  itemPath: (r) => `/admin/destinations/${r.id}`,
  updateMethod: "put",
  filters: [
    { name: "search", label: "Search", type: "search", placeholder: "Name or slug" },
    { name: "status", label: "Status", type: "select", options: [["", "All statuses"], ...STATUS3] },
  ],
  read: (raw) => ({ rows: raw.data.items, pages: raw.data.pagination.totalPages, total: raw.data.pagination.total }),
  columns: [
    { label: "Destination", render: (r) => <><span className="font-semibold text-primary">{r.name}</span><br /><span className="text-xs text-muted">/{r.slug}</span></> },
    { label: "Region", render: (r) => r.region || r.country },
    { label: "Tours", render: (r) => r.tour_count },
    { label: "Status", render: (r) => <StatusBadge value={r.status} /> },
    { label: "Featured", render: (r) => (r.is_featured ? "★" : "") },
    { label: "Updated", render: (r) => formatDate(r.updated_at) },
  ],
  fields: [
    { name: "name", label: "Name", required: true, maxLength: 160 },
    { name: "slug", label: "Slug", maxLength: 180, pattern: "[a-z0-9]+(-[a-z0-9]+)*", autoSlug: "name", hint: "Public URL. Changing it later breaks existing links." },
    { name: "region", label: "Region", maxLength: 120 },
    { name: "country", label: "Country", default: "Bangladesh", maxLength: 100 },
    { name: "featured_image_url", label: "Image URL (https)", type: "url", wide: true, maxLength: 1024, pattern: "https://.*" },
    { name: "description", label: "Description", type: "textarea", wide: true, rows: 6 },
    { name: "meta_title", label: "SEO title", maxLength: 180 },
    { name: "meta_description", label: "SEO description", maxLength: 320 },
    { name: "status", label: "Status", type: "select", options: STATUS3, default: "draft" },
    { name: "is_featured", label: "Featured on the site", type: "checkbox" },
  ],
  toForm: (r) => ({ name: r.name, slug: r.slug, region: r.region ?? "", country: r.country ?? "Bangladesh", featured_image_url: r.featured_image_url ?? "",
    description: r.description ?? "", meta_title: r.meta_title ?? "", meta_description: r.meta_description ?? "", status: r.status, is_featured: !!r.is_featured }),
  // The API rebuilds the whole record on update, so every field is always sent (an unsent is_featured would reset to false, an empty slug would regenerate)
  toPayload: (v) => ({ name: v.name.trim(), slug: v.slug.trim(), region: nn(v.region), country: nn(v.country), featured_image_url: nn(v.featured_image_url),
    description: nn(v.description), meta_title: nn(v.meta_title), meta_description: nn(v.meta_description), status: v.status, is_featured: !!v.is_featured }),
  remove: { label: "Delete", confirm: (r) => `Delete "${r.name}"? This is blocked while tours use it.` },
};