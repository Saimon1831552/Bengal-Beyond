import StatusBadge from "@/components/ui/StatusBadge";
import { nn } from "./shared";

const make = (kind, title, singular) => ({
  title, singular,
  endpoint: `/admin/taxonomy/${kind}`,
  query: { includeInactive: "true" },        // the list hides inactive items by default
  itemPath: (r) => `/admin/taxonomy/${kind}/${r.id}`,
  filters: [{ name: "q", label: "Search", type: "search", placeholder: "Name or slug" }],
  read: (raw) => ({ rows: raw.data, pages: 1, total: raw.data.length }),
  columns: [
    { label: "Name", render: (r) => <><span className="font-semibold text-primary">{r.name}</span><br /><span className="text-xs text-muted">{r.slug}</span></> },
    { label: "Description", render: (r) => r.description || "—" },
    { label: "Status", render: (r) => <StatusBadge value={r.status} /> },
  ],
  fields: [
    { name: "name", label: "Name", required: true, maxLength: 120 },
    { name: "slug", label: "Slug", required: true, maxLength: 140, pattern: "[a-z0-9]+(-[a-z0-9]+)*", autoSlug: "name" },
    { name: "description", label: "Description", wide: true, maxLength: 500 },
    { name: "status", label: "Status", type: "select", options: [["active", "Active"], ["inactive", "Inactive"]], default: "active" },
  ],
  toForm: (r) => ({ name: r.name, slug: r.slug, description: r.description ?? "", status: r.status }),
  // the API requires name on every update, so the full body is always sent
  toPayload: (v) => ({ name: v.name.trim(), slug: v.slug.trim(), description: nn(v.description), status: v.status }),
  remove: { label: "Delete", confirm: (r) => `Delete "${r.name}"? If tours use it, set it inactive instead.` },
});

export const categories = make("categories", "Categories", "category");
export const tags = make("tags", "Tags", "tag");