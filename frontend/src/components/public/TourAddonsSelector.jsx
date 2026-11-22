"use client";
import { useEffect } from "react";
import useFetch from "@/hooks/useFetch";
import { money } from "@/lib/format";

export default function TourAddonsSelector({
  tourId,
  travelers = 1,
  currency = "BDT",
  selectedIds = [],
  onChange,
  onTotalChange,
}) {
  const { data: addons } = useFetch(tourId ? `/public/tours/${tourId}/addons` : null);

  useEffect(() => {
    if (!addons || !onTotalChange) return;
    const total = addons
      .filter((a) => selectedIds.includes(a.id))
      .reduce((sum, a) => {
        const mult = a.pricing_mode === "per_person" ? Math.max(1, Number(travelers)) : 1;
        return sum + Number(a.price) * mult;
      }, 0);
    onTotalChange(total);
  }, [addons, selectedIds, travelers, onTotalChange]);

  if (!addons?.length) return null;

  const toggle = (id) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-background/50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-primary">Optional Extras &amp; Add-ons</p>
      <div className="mt-3 space-y-2.5">
        {addons.map((a) => {
          const checked = selectedIds.includes(a.id);
          const mult = a.pricing_mode === "per_person" ? Math.max(1, Number(travelers)) : 1;
          const linePrice = Number(a.price) * mult;

          return (
            <label
              key={a.id}
              className={`flex cursor-pointer items-start justify-between gap-3 rounded-xl border p-3 text-xs transition ${
                checked ? "border-primary bg-white" : "border-border bg-white/70 hover:bg-white"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(a.id)}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-semibold text-primary">{a.name}</span>
                  {a.description && <span className="mt-0.5 block text-muted">{a.description}</span>}
                </div>
              </div>
              <div className="shrink-0 text-right font-semibold text-primary">
                +{money(linePrice, currency)}
                <span className="block text-[10px] font-normal text-muted">
                  {a.pricing_mode === "per_person" ? `${money(a.price, currency)} × ${mult} pax` : "per booking"}
                </span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}