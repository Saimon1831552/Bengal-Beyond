import StatusBadge from "@/components/ui/StatusBadge";
import { nn, numOrNull, STATUS3 } from "./shared";

export default {
  title: "Gallery", singular: "photo",
  intro: "Images are referenced by URL. Add each image host to images.remotePatterns in next.config.mjs before using next/image on the public site.",
  endpoint: "/gallery/admin",
  itemPath: (r) => `/gallery/admin/${r.id}`,
  filters: [{ name: "status", label: "Status", type: "select", options: [["", "All statuses"], ...STATUS3] }],
  read: (raw) => ({ rows: raw.data.items, pages: raw.data.pagination.pages, total: raw.data.pagination.total }),
  columns: [
    // eslint-disable-next-line @next/next/no-img-element
    { label: "Photo", render: (r) => <img src={r.media_url} alt={r.alt_text || ""} loading="lazy" className="h-14 w-20 rounded-lg object-cover" /> },
    { label: "Title", render: (r) => <span className="font-semibold text-primary">{r.title || "Untitled"}</span> },
    { label: "Order", render: (r) => r.sort_order },
    { label: "Tour", render: (r) => (r.tour_id ? `#${r.tour_id}` : "—") },
    { label: "Status", render: (r) => <StatusBadge value={r.status} /> },
  ],
  fields: [
    { name: "media_url", label: "Image URL", type: "url", required: true, wide: true, maxLength: 1024 },
    { name: "title", label: "Title", maxLength: 200 },
    { name: "alt_text", label: "Alt text", maxLength: 255 },
    { name: "tour_id", label: "Tour ID (optional)", type: "number", min: 1, step: 1 },
    { name: "sort_order", label: "Sort order", type: "number", step: 1, default: 0, hint: "Lower numbers show first." },
    { name: "status", label: "Status", type: "select", options: STATUS3, default: "draft" },
  ],
  toForm: (r) => ({ media_url: r.media_url, title: r.title ?? "", alt_text: r.alt_text ?? "", tour_id: r.tour_id ?? "", sort_order: r.sort_order ?? 0, status: r.status }),
  toPayload: (v) => ({ media_url: v.media_url.trim(), title: nn(v.title), alt_text: nn(v.alt_text), tour_id: numOrNull(v.tour_id),
    sort_order: Number(v.sort_order) || 0, status: v.status }),
  remove: { label: "Delete", confirm: (r) => `Delete this photo permanently?` },
};