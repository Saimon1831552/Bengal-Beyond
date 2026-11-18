import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate, toLocalInput, toSqlUtc } from "@/lib/format";
import { nn, numOrNull } from "./shared";

export default {
  title: "Coupons & discounts", singular: "coupon",
  intro: "Percentage coupons apply to the booking subtotal. Fixed coupons are plain amounts in the booking's currency.",
  endpoint: "/admin/coupons",
  itemPath: (r) => `/admin/coupons/${r.id}`,
  filters: [
    { name: "q", label: "Search", type: "search", placeholder: "Code or name" },
    { name: "status", label: "Status", type: "select", options: [["", "All"], ["active", "Active"], ["inactive", "Inactive"]] },
  ],
  read: (raw) => ({ rows: raw.data, pages: raw.meta?.totalPages || 1, total: raw.meta?.total }),
  columns: [
    { label: "Code", render: (r) => <><span className="font-mono font-semibold text-primary">{r.code}</span><br /><span className="text-xs text-muted">{r.name}</span></> },
    { label: "Discount", render: (r) => (r.discountType === "percentage" ? `${Number(r.discountValue)}%` : Number(r.discountValue).toLocaleString()) },
    { label: "Min order", render: (r) => (Number(r.minOrderAmount) ? Number(r.minOrderAmount).toLocaleString() : "—") },
    { label: "Limits", render: (r) => `${r.usageLimit ?? "∞"} total · ${r.perUserLimit}/user` },
    { label: "Valid", render: (r) => (r.startsAt || r.endsAt ? `${r.startsAt ? formatDate(r.startsAt) : "…"} → ${r.endsAt ? formatDate(r.endsAt) : "…"}` : "Always") },
    { label: "Status", render: (r) => <StatusBadge value={r.status} /> },
  ],
  fields: [
    { name: "code", label: "Code", required: true, readOnlyOnEdit: true, maxLength: 40, pattern: "[A-Za-z0-9][A-Za-z0-9_-]{2,39}", hint: "3 to 40 letters, numbers, - or _. Cannot be changed later." },
    { name: "name", label: "Name", required: true, maxLength: 160 },
    { name: "discountType", label: "Type", type: "select", options: [["percentage", "Percentage"], ["fixed", "Fixed amount"]], default: "percentage" },
    { name: "discountValue", label: "Value", type: "number", required: true, min: 0.01, step: "0.01" },
    { name: "minOrderAmount", label: "Minimum order", type: "number", min: 0, step: "0.01", default: "0" },
    { name: "maxDiscountAmount", label: "Maximum discount", type: "number", min: 0, step: "0.01", hint: "Blank = no cap." },
    { name: "usageLimit", label: "Total uses", type: "number", min: 1, step: 1, hint: "Blank = unlimited." },
    { name: "perUserLimit", label: "Uses per customer", type: "number", min: 1, step: 1, default: 1 },
    { name: "startsAt", label: "Starts", type: "datetime-local", hint: "Your browser's timezone." },
    { name: "endsAt", label: "Ends", type: "datetime-local" },
    { name: "status", label: "Status", type: "select", options: [["active", "Active"], ["inactive", "Inactive"]], default: "active" },
    { name: "description", label: "Internal description", type: "textarea", rows: 2, wide: true },
  ],
  validate: (v) => {
    if (v.discountType === "percentage" && Number(v.discountValue) > 100) return "A percentage discount cannot exceed 100.";
    if (v.startsAt && v.endsAt && new Date(v.endsAt) <= new Date(v.startsAt)) return "The end must be after the start.";
    return "";
  },
  toForm: (r) => ({ code: r.code, name: r.name, discountType: r.discountType, discountValue: r.discountValue, minOrderAmount: r.minOrderAmount, maxDiscountAmount: r.maxDiscountAmount ?? "",
    usageLimit: r.usageLimit ?? "", perUserLimit: r.perUserLimit, startsAt: toLocalInput(r.startsAt), endsAt: toLocalInput(r.endsAt), status: r.status, description: r.description ?? "" }),
  toPayload: (v, mode) => ({
    ...(mode === "new" && { code: v.code.trim().toUpperCase() }),   // the code is not editable after creation
    name: v.name.trim(), description: nn(v.description), discountType: v.discountType, discountValue: String(v.discountValue),
    minOrderAmount: String(v.minOrderAmount || "0"), maxDiscountAmount: nn(v.maxDiscountAmount), usageLimit: numOrNull(v.usageLimit),
    perUserLimit: Number(v.perUserLimit) || 1, startsAt: toSqlUtc(v.startsAt), endsAt: toSqlUtc(v.endsAt), status: v.status,
  }),
  remove: { label: "Delete", confirm: (r) => `Delete coupon ${r.code}? If it was ever used, deactivate it instead.` },
};