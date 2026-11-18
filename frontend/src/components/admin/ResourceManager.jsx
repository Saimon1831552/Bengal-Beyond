"use client";
import { useRef, useState } from "react";
import Container from "@/components/ui/Container";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";
import { slugify } from "@/lib/format";

const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:bg-background disabled:text-muted";
const initial = (cfg) => Object.fromEntries(cfg.fields.map((f) => [f.name, f.type === "checkbox" ? !!f.default : f.default ?? ""]));

function Input({ f, value, onChange, disabled }) {
  const c = { id: `f-${f.name}`, name: f.name, required: f.required, disabled, placeholder: f.placeholder };
  if (f.type === "textarea") return <textarea {...c} rows={f.rows || 4} maxLength={f.maxLength} className={inp} value={value} onChange={(e) => onChange(e.target.value)} />;
  if (f.type === "select") return (
    <select {...c} className={inp} value={value} onChange={(e) => onChange(e.target.value)}>
      {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
  if (f.type === "checkbox") return <input {...c} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[var(--accent)]" />;
  return <input {...c} type={f.type || "text"} min={f.min} max={f.max} step={f.step} maxLength={f.maxLength} pattern={f.pattern}
    className={inp} value={value} onChange={(e) => onChange(e.target.value)} />;
}

function Form({ cfg, mode, row, onDone, onCancel }) {
  const [values, setValues] = useState(() => (mode === "edit" ? cfg.toForm(row) : initial(cfg)));
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const touched = useRef(new Set());

  const set = (f, val) => {
    if (f.autoSlug) touched.current.add(f.name);
    setValues((v) => {
      const n = { ...v, [f.name]: val };
      for (const g of cfg.fields) if (g.autoSlug === f.name && mode === "new" && !touched.current.has(g.name)) n[g.name] = slugify(val);
      return n;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    const bad = cfg.validate?.(values, mode);
    if (bad) return setMsg(bad);
    setBusy(true); setMsg("");
    try {
      const payload = cfg.toPayload(values, mode);
      if (mode === "new") await api.post(cfg.endpoint, payload);
      else await api[cfg.updateMethod || "patch"](cfg.itemPath(row), payload);
      await onDone(mode === "new" ? "Created." : "Saved.");
    } catch (err) { setMsg(errMsg(err)); setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-5 rounded-3xl border border-border bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {cfg.fields.map((f) => (
          <div key={f.name} className={f.wide ? "sm:col-span-2" : ""}>
            {f.type === "checkbox" ? (
              <label className="flex items-center gap-2 pt-6 text-sm font-medium">
                <Input f={f} value={values[f.name]} onChange={(v) => set(f, v)} />{f.label}
              </label>
            ) : (
              <label className="block text-sm font-medium">{f.label}{f.required && <span className="text-terracotta"> *</span>}
                <Input f={f} value={values[f.name]} onChange={(v) => set(f, v)} disabled={mode === "edit" && f.readOnlyOnEdit} />
              </label>
            )}
            {f.hint && <p className="mt-1 text-xs text-muted">{f.hint}</p>}
          </div>
        ))}
      </div>
      {msg && <p role="alert" className="text-sm text-terracotta">{msg}</p>}
      <div className="flex gap-3">
        <button disabled={busy} className="btn-gold rounded-full px-7 py-2.5 text-sm font-semibold disabled:opacity-60">{busy ? "Saving…" : mode === "new" ? `Create ${cfg.singular}` : "Save changes"}</button>
        <button type="button" onClick={onCancel} className="text-sm font-semibold text-primary underline">Cancel</button>
      </div>
    </form>
  );
}

export default function ResourceManager({ cfg }) {
  const defaults = cfg.defaultFilters || {};
  const [filters, setFilters] = useState(defaults);
  const [applied, setApplied] = useState(defaults);
  const [page, setPage] = useState(1);
  const [view, setView] = useState(null); // null | { mode: "new" } | { mode: "edit", row }
  const [busy, setBusy] = useState("");
  const [flash, setFlash] = useState({ type: "", text: "" });

  const qs = new URLSearchParams({ page, limit: cfg.pageSize || 20, ...(cfg.query || {}) });
  for (const [k, v] of Object.entries(applied)) if (v) qs.set(k, v);
  const { raw, error, loading, reload } = useFetch(`${cfg.endpoint}?${qs}`);
  const { rows = [], pages = 1, total } = raw ? cfg.read(raw) : {};

  const ok = (text) => setFlash({ type: "ok", text });
  const bad = (e) => setFlash({ type: "error", text: errMsg(e) });

  const guarded = async (key, fn) => {
    setBusy(key); setFlash({ type: "", text: "" });
    try { await fn(); } catch (e) { bad(e); } finally { setBusy(""); }
  };

  const edit = (row) => guarded(`e${row.id}`, async () =>
    setView({ mode: "edit", row: cfg.loadRow ? await cfg.loadRow(row, api) : row }));
  const remove = (row) => {
    if (!window.confirm(cfg.remove.confirm(row))) return;
    guarded(`d${row.id}`, async () => { await api.delete(cfg.itemPath(row)); ok(`${cfg.remove.label} done.`); await reload(); });
  };
  const act = (a, row) => {
    if (a.confirm && !window.confirm(a.confirm(row))) return;
    guarded(`${a.label}${row.id}`, async () => { await a.run(row, api); ok("Done."); await reload(); });
  };

  if (view) {
    return (
      <Container as="main" className="max-w-4xl py-8">
        <button onClick={() => setView(null)} className="text-sm text-accent link-underline">← {cfg.title}</button>
        <h1 className="mb-6 mt-3 text-3xl text-primary">{view.mode === "new" ? `New ${cfg.singular}` : `Edit ${cfg.singular}`}</h1>
        <Form cfg={cfg} mode={view.mode} row={view.row}
          onDone={async (t) => { setView(null); ok(t); await reload(); }} onCancel={() => setView(null)} />
      </Container>
    );
  }

  return (
    <Container as="main" className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl text-primary">{cfg.title}</h1>
        {!cfg.noCreate && <button onClick={() => setView({ mode: "new" })} className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold">New {cfg.singular}</button>}
      </div>
      {cfg.intro && <p className="mt-2 text-sm text-muted">{cfg.intro}</p>}

      <form onSubmit={(e) => { e.preventDefault(); setPage(1); setApplied(filters); }} className="mt-6 flex flex-wrap items-end gap-3">
        {(cfg.filters || []).map((f) => f.type === "select" ? (
          <select key={f.name} aria-label={f.label} value={filters[f.name] || ""} onChange={(e) => setFilters({ ...filters, [f.name]: e.target.value })} className="rounded-xl border border-border bg-white px-3 py-2 text-sm">
            {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ) : (
          <input key={f.name} aria-label={f.label} placeholder={f.placeholder} value={filters[f.name] || ""} onChange={(e) => setFilters({ ...filters, [f.name]: e.target.value })} className="w-64 rounded-xl border border-border bg-white px-3 py-2 text-sm" />
        ))}
        <button className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">Filter</button>
        {total != null && <span className="text-sm text-muted">{total} total</span>}
      </form>

      {flash.text && <p role={flash.type === "error" ? "alert" : "status"} className={`mt-4 text-sm ${flash.type === "error" ? "text-terracotta" : "text-primary"}`}>{flash.text}</p>}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? <div className="p-6"><Loading /></div> : error ? <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div> :
          !rows.length ? <div className="p-6"><Empty>Nothing here yet.</Empty></div> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>{cfg.columns.map((c, i) => <th key={c.label} className={i === 0 ? "px-5 py-3" : "py-3"}>{c.label}</th>)}<th className="pr-5" /></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.id} className="align-top">
                  {cfg.columns.map((c, i) => <td key={c.label} className={i === 0 ? "px-5 py-3" : "py-3 pr-3"}>{c.render(r)}</td>)}
                  <td className="space-x-3 whitespace-nowrap py-3 pr-5 text-right text-xs font-semibold">
                    {(cfg.rowActions || []).filter((a) => !a.show || a.show(r)).map((a) => (
                      <button key={a.label} disabled={!!busy} onClick={() => act(a, r)} className={`underline disabled:opacity-40 ${a.danger ? "text-terracotta" : "text-primary"}`}>{a.label}</button>
                    ))}
                    <button disabled={!!busy} onClick={() => edit(r)} className="text-primary underline disabled:opacity-40">Edit</button>
                    {cfg.remove && <button disabled={!!busy} onClick={() => remove(r)} className="text-terracotta underline disabled:opacity-40">{cfg.remove.label}</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full border border-primary px-4 py-2 disabled:opacity-40">Previous</button>
          <span>Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-full border border-primary px-4 py-2 disabled:opacity-40">Next</button>
        </div>
      )}
    </Container>
  );
}