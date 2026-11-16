"use client";
import { useRef, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { inputCls } from "@/components/ui/Field";
import { SORTS, DURATION_OPTIONS } from "@/lib/tourFilters";

const label = "block text-xs font-semibold uppercase tracking-wide text-primary";

export default function TourFilters({ values: v, destinations, categories }) {
  const router = useRouter();
  const ref = useRef(null);
  const [pending, start] = useTransition();

  const apply = (e) => {
    e?.preventDefault?.();
    const p = new URLSearchParams();
    for (const [k, val] of new FormData(ref.current)) {
      const s = String(val).trim();
      if (s && !(k === "sort" && s === "recommended")) p.set(k, s);
    }
    start(() => router.push(p.toString() ? `/tours?${p}` : "/tours"));
  };

  // key: re-mount when the URL changes (for example after removing a chip) so the fields reset
  return (
    <form ref={ref} onSubmit={apply} key={JSON.stringify(v)} aria-busy={pending}
      className="space-y-4 rounded-3xl border border-border bg-white p-5 lg:sticky lg:top-24">
      <label className={label}>Search
        <input name="q" defaultValue={v.q} maxLength={120} placeholder="Sundarbans, trek, food…" className={inputCls} />
      </label>
      <label className={label}>Destination
        <select name="destination" defaultValue={v.destination} className={inputCls}>
          <option value="">Anywhere</option>
          {destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}
        </select>
      </label>
      {categories.length > 0 && (
        <label className={label}>Category
          <select name="category" defaultValue={v.category} className={inputCls}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      )}
      <label className={label}>Duration
        <select name="duration" defaultValue={v.duration} className={inputCls}>
          <option value="">Any length</option>
          {DURATION_OPTIONS.map(([val, text]) => <option key={val} value={val}>{text}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>Min price
          <input name="minPrice" type="number" min={0} step="1" defaultValue={v.minPrice} className={inputCls} />
        </label>
        <label className={label}>Max price
          <input name="maxPrice" type="number" min={0} step="1" defaultValue={v.maxPrice} className={inputCls} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>Departs from
          <input name="date" type="date" defaultValue={v.date} className={inputCls} />
        </label>
        <label className={label}>Travellers
          <input name="guests" type="number" min={1} max={100} defaultValue={v.guests} placeholder="Any" className={inputCls} />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input name="available" type="checkbox" value="1" defaultChecked={!!v.available} className="h-4 w-4 accent-[var(--accent)]" />
        Only tours with open seats
      </label>
      <label className={label}>Sort by
        <select name="sort" defaultValue={v.sort} onChange={apply} className={inputCls}>
          {SORTS.map(([val, text]) => <option key={val} value={val}>{text}</option>)}
        </select>
      </label>
      <div className="flex items-center gap-4">
        <button disabled={pending} className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-60">{pending ? "Searching…" : "Apply"}</button>
        <Link href="/tours" className="text-sm font-semibold text-primary underline">Clear all</Link>
      </div>
    </form>
  );
}