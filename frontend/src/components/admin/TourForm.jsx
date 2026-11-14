"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Field, { inputCls } from "@/components/ui/Field";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";

const EMPTY = { title: "", slug: "", destination: "", summary: "", description: "", duration_days: 1, base_price: "", currency_code: "BDT", cover_image_url: "", cancellation_policy: "" };

export default function TourForm({ tour, onSaved }) {
  const router = useRouter();
  const { data: dests } = useFetch("/destinations?limit=100");
  const [f, setF] = useState(tour ? Object.fromEntries(Object.keys(EMPTY).map((k) => [k, tour[k] ?? ""])) : EMPTY);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg({ type: "", text: "" });
    const payload = {
      title: f.title.trim(),
      destination: f.destination.trim(),
      duration_days: Number(f.duration_days),
      base_price: Number(f.base_price),
      currency_code: f.currency_code.trim().toUpperCase(),
      summary: f.summary.trim() || null,
      description: f.description.trim() || null,
      cover_image_url: f.cover_image_url.trim() || null,
      cancellation_policy: f.cancellation_policy.trim() || null,
    };
    if (f.slug.trim()) payload.slug = f.slug.trim();
    try {
      if (tour) {
        await api.patch(`/admin/tours/${tour.id}`, payload);
        setMsg({ type: "ok", text: "Saved." });
        await onSaved?.();
      } else {
        const res = await api.post("/admin/tours", payload);
        router.push(`/admin/tours/${res.data.data.id}`);
      }
    } catch (err) { setMsg({ type: "error", text: errMsg(err) }); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-3xl border border-border bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" required minLength={2} maxLength={200} value={f.title} onChange={set("title")} />
        <Field label="Slug" maxLength={180} pattern="[a-z0-9]+(-[a-z0-9]+)*" hint={tour ? "The public URL. Changing it breaks existing links." : "Optional. Generated from the title if empty."} value={f.slug} onChange={set("slug")} />
        <Field label="Destination" required list="dest-list" maxLength={160} hint="Pick an existing destination so the tour shows on its page." value={f.destination} onChange={set("destination")} />
        <datalist id="dest-list">{(dests?.items || []).map((d) => <option key={d.slug} value={d.name} />)}</datalist>
        <Field label="Duration (days)" type="number" required min={1} max={365} value={f.duration_days} onChange={set("duration_days")} />
        <Field label="Base price per person" type="number" required min={0} step="0.01" value={f.base_price} onChange={set("base_price")} />
        <Field label="Currency" required maxLength={3} minLength={3} hint="Online payment only works with BDT." value={f.currency_code} onChange={set("currency_code")} />
      </div>
      <Field label="Cover image URL" type="url" maxLength={1024} value={f.cover_image_url} onChange={set("cover_image_url")} />
      {f.cover_image_url && /^https?:\/\//.test(f.cover_image_url) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={f.cover_image_url} alt="Cover preview" className="h-40 rounded-xl object-cover" />
      )}
      <Field label="Summary" as="textarea" rows={2} maxLength={500} value={f.summary} onChange={set("summary")} />
      <Field label="Description" as="textarea" rows={8} maxLength={100000} value={f.description} onChange={set("description")} />
      <Field label="Cancellation policy" as="textarea" rows={4} maxLength={20000} value={f.cancellation_policy} onChange={set("cancellation_policy")} />
      {msg.text && <p role={msg.type === "error" ? "alert" : "status"} className={`text-sm ${msg.type === "error" ? "text-terracotta" : "text-primary"}`}>{msg.text}</p>}
      <button disabled={busy} className="btn-gold rounded-full px-8 py-3 font-semibold disabled:opacity-60">{busy ? "Saving…" : tour ? "Save changes" : "Create tour (as draft)"}</button>
    </form>
  );
}