"use client";
import { useState } from "react";
import Link from "next/link";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";

function Group({ title, items, sel, setSel }) {
  const flip = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-primary">{title}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((i) => (
          <label key={i.id} className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${sel.has(i.id) ? "border-accent bg-accent/15 text-primary" : "border-border"}`}>
            <input type="checkbox" className="sr-only" checked={sel.has(i.id)} onChange={() => flip(i.id)} />{i.name}
          </label>
        ))}
        {!items.length && <span className="text-sm text-muted">None yet.</span>}
      </div>
    </fieldset>
  );
}

export default function TourTaxonomy({ tourId }) {
  const cats = useFetch("/categories");
  const tags = useFetch("/tags");
  const cur = useFetch(`/tours/${tourId}/taxonomy`);
  const [c, setC] = useState(null);
  const [t, setT] = useState(null);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);
  const [prevCurData, setPrevCurData] = useState(cur.data);

  if (cur.data !== prevCurData) {
    setPrevCurData(cur.data);
    if (cur.data) {
      setC(new Set(cur.data.categories.map((x) => x.id)));
      setT(new Set(cur.data.tags.map((x) => x.id)));
    }
  }

  if (!cats.data || !tags.data || !c || !t) return null;
  const save = async () => {
    setBusy(true); setMsg({ type: "", text: "" });
    try { await api.put(`/admin/taxonomy/tours/${tourId}/taxonomy`, { categoryIds: [...c], tagIds: [...t] }); setMsg({ type: "ok", text: "Saved." }); }
    catch (e) { setMsg({ type: "error", text: errMsg(e) }); } finally { setBusy(false); }
  };

  return (
    <section className="space-y-4 rounded-3xl border border-border bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl text-primary">Categories &amp; tags</h2>
        <Link href="/admin/categories" className="text-xs font-semibold text-accent underline">Manage lists</Link>
      </div>
      <Group title="Categories" items={cats.data} sel={c} setSel={setC} />
      <Group title="Tags" items={tags.data} sel={t} setSel={setT} />
      <div className="flex items-center gap-4">
        <button onClick={save} disabled={busy} className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-60">{busy ? "Saving…" : "Save"}</button>
        {msg.text && <p role={msg.type === "error" ? "alert" : "status"} className={`text-sm ${msg.type === "error" ? "text-terracotta" : "text-primary"}`}>{msg.text}</p>}
      </div>
    </section>
  );
}