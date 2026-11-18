import { titleCase } from "@/lib/format";

const tone = {
  active: "bg-accent/15 text-primary",
  archived: "bg-border text-muted",
  approved: "bg-accent/15 text-primary", confirmed: "bg-accent/15 text-primary", paid: "bg-accent/15 text-primary", succeeded: "bg-accent/15 text-primary", completed: "bg-accent/15 text-primary",
  published: "bg-accent/15 text-primary", scheduled: "bg-accent/15 text-primary",
  pending: "bg-gold/20 text-primary-dark", pending_review: "bg-gold/20 text-primary-dark", awaiting_payment: "bg-gold/20 text-primary-dark", initiated: "bg-gold/20 text-primary-dark", unpaid: "bg-gold/20 text-primary-dark",
  open: "bg-gold/20 text-primary-dark", waiting_customer: "bg-gold/20 text-primary-dark",
  high: "bg-gold/25 text-primary-dark",
  requested: "bg-gold/20 text-primary-dark", cancellation_requested: "bg-gold/20 text-primary-dark",
  refunded: "bg-ocean/15 text-ocean", partially_refunded: "bg-ocean/15 text-ocean",
  in_progress: "bg-ocean/15 text-ocean",
  draft: "bg-gold/20 text-primary-dark", unpublished: "bg-gold/20 text-primary-dark",
  resolved: "bg-accent/15 text-primary",
  failed: "bg-terracotta/15 text-terracotta", rejected: "bg-terracotta/15 text-terracotta", cancelled: "bg-terracotta/15 text-terracotta", expired: "bg-terracotta/15 text-terracotta",
  sold_out: "bg-terracotta/15 text-terracotta",
  suspended: "bg-terracotta/15 text-terracotta",
  urgent: "bg-terracotta/15 text-terracotta",
  closed: "bg-border text-muted", normal: "bg-border text-muted", low: "bg-border text-muted",
  inactive: "bg-border text-muted",
};

export default function StatusBadge({ value }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${tone[value] || "bg-border text-muted"}`}>
      {titleCase(value)}
    </span>
  );
}