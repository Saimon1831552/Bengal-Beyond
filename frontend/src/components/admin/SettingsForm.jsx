"use client";
import { useEffect, useState } from "react";
import Container from "@/components/ui/Container";
import { Loading, ErrorBox } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";
import { formatDateTime } from "@/lib/format";

const TITLES = { general: "Site", contact: "Contact details", booking: "Bookings", operations: "Operations" };
const HINTS = {
  site_name: "Used inside the admin area. Public SEO titles come from config/site.js.",
  support_email: "Shown in the website footer.",
  support_phone: "Shown in the website footer.",
  support_url: "Stored for later. Not shown on the site yet.",
  default_currency: "Stored only. Bookings use each tour's own currency. Online payment needs BDT.",
  booking_cancellation_enabled: "Stored only. Not applied by the cancellation flow yet.",
  booking_cancellation_window_hours: "Stored only. Not applied yet.",
  booking_cancellation_fee_percent: "Stored only. Not applied yet.",
  max_booking_party_size: "Enforced when a booking is created (needs backend patch 0.4).",
  member_discount_percent: "Automatic discount for logged-in customers at booking. Guests get none.",
  maintenance_mode: "Blocks the public site and API for visitors. Admin pages and login keep working.",
  maintenance_message: "Shown to visitors in a banner while maintenance mode is on.",
};
const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";

const isNum = (s) => s.type === "integer" || s.type === "number";
function norm(s, v) {
  if (s.type === "boolean") return !!v;
  if (isNum(s)) return v === "" || v == null ? NaN : Number(v);
  const t = String(v ?? "").trim();
  return s.type === "currency" ? t.toUpperCase() : t;
}
const show = (v) => { const s = typeof v === "string" ? v : JSON.stringify(v); return s.length > 60 ? `${s.slice(0, 57)}…` : s || "(empty)"; };

export default function SettingsForm({ title, intro, categories }) {
  const { data, error, loading, reload } = useFetch("/admin/settings");
  const hist = useFetch("/admin/settings/history?limit=8");
  const [vals, setVals] = useState({});
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => { if (data) setVals(Object.fromEntries(data.map((s) => [s.key, s.value]))); }, [data]);

  if (loading) return <Container className="py-8"><Loading /></Container>;
  if (error) return <Container className="py-8"><ErrorBox error={error} onRetry={reload} /></Container>;

  const items = data.filter((s) => categories.includes(s.category));
  const set = (k, v) => setVals((x) => ({ ...x, [k]: v }));
  const changed = items.filter((s) => norm(s, vals[s.key]) !== s.value);
  const maintenanceOn = norm(data.find((s) => s.key === "maintenance_mode") || {}, vals.maintenance_mode);

  const save = async (e) => {
    e.preventDefault();
    const settings = {};
    for (const s of changed) {
      const v = norm(s, vals[s.key]);
      if (isNum(s) && Number.isNaN(v)) return setMsg({ type: "error", text: `${s.label} needs a number.` });
      settings[s.key] = v;
    }
    if (settings.maintenance_mode === true &&
        !window.confirm("Turn ON maintenance mode? Visitors will see the maintenance message and cannot use the site until you turn it off.")) return;
    setBusy(true); setMsg({ type: "", text: "" });
    try {
      const res = await api.put("/admin/settings/bulk", { settings, ...(reason.trim() && { reason: reason.trim() }) });
      setMsg({ type: "ok", text: `${res.data.data.updatedCount} setting(s) updated.` });
      setReason("");
      await Promise.all([reload(), hist.reload()]);
    } catch (err) { setMsg({ type: "error", text: errMsg(err) }); } finally { setBusy(false); }
  };

  return (
    <Container as="main" className="max-w-3xl py-8">
      <h1 className="text-3xl text-primary">{title}</h1>
      {intro && <p className="mt-2 text-sm text-muted">{intro}</p>}
      {maintenanceOn && categories.includes("operations") && (
        <p role="status" className="mt-4 rounded-2xl bg-terracotta/15 p-4 text-sm font-semibold text-terracotta">Maintenance mode is ON for visitors.</p>
      )}

      <form onSubmit={save} className="mt-6 space-y-6">
        {categories.map((cat) => {
          const list = items.filter((s) => s.category === cat);
          if (!list.length) return null;
          return (
            <fieldset key={cat} className="space-y-5 rounded-3xl border border-border bg-white p-6">
              <legend className="px-2 text-sm font-bold uppercase tracking-widest text-muted">{TITLES[cat] || cat}</legend>
              {list.map((s) => {
                const id = `s-${s.key}`;
                const dirty = norm(s, vals[s.key]) !== s.value;
                return (
                  <div key={s.key}>
                    {s.type === "boolean" ? (
                      <label htmlFor={id} className="flex items-center gap-3 text-sm font-medium">
                        <input id={id} type="checkbox" checked={!!vals[s.key]} onChange={(e) => set(s.key, e.target.checked)} className="h-5 w-5 accent-[var(--accent)]" />
                        {s.label}{dirty && <span className="text-xs text-gold">● changed</span>}
                      </label>
                    ) : (
                      <>
                        <label htmlFor={id} className="block text-sm font-medium">{s.label}{dirty && <span className="ml-2 text-xs text-gold">● changed</span>}</label>
                        {s.key === "maintenance_message"
                          ? <textarea id={id} rows={3} maxLength={500} className={inp} value={vals[s.key] ?? ""} onChange={(e) => set(s.key, e.target.value)} />
                          : <input id={id} className={inp} value={vals[s.key] ?? ""} onChange={(e) => set(s.key, e.target.value)}
                              type={isNum(s) ? "number" : s.type === "email" ? "email" : s.type === "url" ? "url" : "text"}
                              step={s.type === "number" ? "any" : undefined} maxLength={s.type === "currency" ? 3 : undefined} />}
                      </>
                    )}
                    {HINTS[s.key] && <p className="mt-1 text-xs text-muted">{HINTS[s.key]}</p>}
                  </div>
                );
              })}
            </fieldset>
          );
        })}

        <label className="block text-sm font-medium">Reason for change (optional, kept in the history)
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} className={inp} />
        </label>
        {msg.text && <p role={msg.type === "error" ? "alert" : "status"} className={`text-sm ${msg.type === "error" ? "text-terracotta" : "text-primary"}`}>{msg.text}</p>}
        <button disabled={busy || !changed.length} className="btn-gold rounded-full px-8 py-3 font-semibold disabled:opacity-50">
          {busy ? "Saving…" : changed.length ? `Save ${changed.length} change${changed.length > 1 ? "s" : ""}` : "No changes"}
        </button>
      </form>

      {hist.data?.items?.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl text-primary">Recent changes</h2>
          <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-white text-sm">
            {hist.data.items.map((h) => (
              <li key={h.id} className="px-5 py-3">
                <span className="font-mono text-xs text-primary">{h.key}</span>: {show(h.previousValue)} → <strong>{show(h.value)}</strong>
                <span className="block text-xs text-muted">{formatDateTime(h.createdAt)} · {h.actor?.name || "system"}{h.reason ? ` · “${h.reason}”` : ""}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Container>
  );
}