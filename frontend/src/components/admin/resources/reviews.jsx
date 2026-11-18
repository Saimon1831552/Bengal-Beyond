import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/format";
import { nn } from "./shared";

const set = (status) => (r, api) => api.patch(`/admin/reviews/${r.id}`, { status });

export default {
  title: "Reviews & ratings", singular: "review", noCreate: true,
  intro: "Only customers with a completed booking can review. Reviews stay hidden until you publish them.",
  endpoint: "/admin/reviews",
  itemPath: (r) => `/admin/reviews/${r.id}`,
  defaultFilters: { status: "pending" },
  filters: [{ name: "status", label: "Status", type: "select", options: [["", "All"], ["pending", "Pending"], ["published", "Published"], ["rejected", "Rejected"]] }],
  read: (raw) => ({ rows: raw.data, pages: raw.meta?.pagination?.totalPages || 1, total: raw.meta?.pagination?.total }),
  columns: [
    { label: "Tour", render: (r) => <span className="font-semibold text-primary">{r.tourTitle}</span> },
    { label: "Review", render: (r) => (
      <div className="max-w-md"><span className="text-gold" aria-label={`${r.rating} of 5`}>{"★".repeat(r.rating)}</span><span className="text-border">{"★".repeat(5 - r.rating)}</span>
        <p className="mt-1">{r.reviewText || <span className="text-muted">No text</span>}</p>
        {r.adminReply && <p className="mt-1 rounded-lg bg-accent/10 p-2 text-xs">Reply: {r.adminReply}</p>}</div>) },
    { label: "By", render: (r) => r.reviewerName },
    { label: "Status", render: (r) => <StatusBadge value={r.status} /> },
    { label: "Date", render: (r) => formatDate(r.createdAt) },
  ],
  rowActions: [
    { label: "Publish", show: (r) => r.status !== "published", run: set("published") },
    { label: "Reject", show: (r) => r.status !== "rejected", run: set("rejected"), danger: true, confirm: () => "Reject this review?" },
  ],
  fields: [
    { name: "status", label: "Decision", type: "select", options: [["", "Keep as is"], ["published", "Publish"], ["rejected", "Reject"]] },
    { name: "adminReply", label: "Public reply from the team", type: "textarea", wide: true, rows: 4, maxLength: 5000 },
  ],
  toForm: (r) => ({ status: "", adminReply: r.adminReply ?? "" }),
  toPayload: (v) => ({ ...(v.status && { status: v.status }), adminReply: nn(v.adminReply) }),
};