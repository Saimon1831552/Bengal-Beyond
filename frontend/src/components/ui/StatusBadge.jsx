import { titleCase } from "@/lib/format";

const tone = {
  confirmed: "bg-accent/15 text-primary", paid: "bg-accent/15 text-primary", succeeded: "bg-accent/15 text-primary", completed: "bg-accent/15 text-primary",
  published: "bg-accent/15 text-primary", scheduled: "bg-accent/15 text-primary",
  pending: "bg-gold/20 text-primary-dark", pending_review: "bg-gold/20 text-primary-dark", awaiting_payment: "bg-gold/20 text-primary-dark", initiated: "bg-gold/20 text-primary-dark", unpaid: "bg-gold/20 text-primary-dark",
  draft: "bg-gold/20 text-primary-dark", unpublished: "bg-gold/20 text-primary-dark",
  failed: "bg-terracotta/15 text-terracotta", rejected: "bg-terracotta/15 text-terracotta", cancelled: "bg-terracotta/15 text-terracotta", expired: "bg-terracotta/15 text-terracotta",
  sold_out: "bg-terracotta/15 text-terracotta",
};

export default function StatusBadge({ value }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${tone[value] || "bg-border text-muted"}`}>
      {titleCase(value)}
    </span>
  );
}