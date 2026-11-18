"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { formatDateTime, titleCase } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const STATUS = ["open", "in_progress", "waiting_customer", "resolved", "closed"];
const PRIORITY = ["urgent", "high", "normal", "low"];
const sel = "rounded-xl border border-border bg-white px-3 py-2 text-sm";

export default function AdminInquiryDetail({ id }) {
  const me = useAuthStore((s) => s.user);
  const { data: t, error, loading, reload } = useFetch(`/admin/support/${encodeURIComponent(id)}`);
  const [text, setText] = useState("");
  const [internal, setInternal] = useState(false);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  if (loading) return <Container className="py-8"><Loading /></Container>;
  if (error) return <Container className="py-8"><ErrorBox error={error} onRetry={reload} /></Container>;

  const run = async (name, fn, ok) => {
    setBusy(name); setMsg({ type: "", text: "" });
    try { await fn(); setMsg({ type: "ok", text: ok }); await reload(); return true; }
    catch (e) { setMsg({ type: "error", text: errMsg(e) }); return false; }
    finally { setBusy(""); }
  };
  const patch = (body, ok) => run("patch", () => api.patch(`/admin/support/${t.id}`, body), ok);
  const send = async (e) => {
    e.preventDefault();
    const ok = await run("send", () => api.post(`/admin/support/${t.id}/messages`, { message: text.trim(), internal }), internal ? "Note saved." : "Reply sent. The customer is emailed.");
    if (ok) setText("");
  };

  const who = t.guest_name || t.account_name;
  const email = t.guest_email || t.account_email;
  const box = "rounded-2xl border border-border bg-white p-5";

  return (
    <Container as="main" className="max-w-4xl space-y-6 py-8">
      <Link href="/admin/inquiries" className="text-sm text-accent link-underline">← All inquiries</Link>
      <div>
        <h1 className="text-3xl text-primary">{t.subject}</h1>
        <p className="mt-1 font-mono text-xs text-muted">{t.ticket_reference} · {titleCase(t.category)} · opened {formatDateTime(t.created_at)}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className={box}>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted">Customer</h2>
          <p className="mt-2 text-sm">{who}{t.user_id && <span className="ml-2 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-primary">Registered</span>}<br />
            <a href={`mailto:${email}`} className="text-accent underline">{email}</a>{t.guest_phone && <><br />{t.guest_phone}</>}</p>
        </section>
        <section className={box}>
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted">Handling</h2>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <select aria-label="Status" value={t.status} disabled={busy === "patch"} onChange={(e) => patch({ status: e.target.value }, "Status updated.")} className={sel}>{STATUS.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</select>
            <select aria-label="Priority" value={t.priority} disabled={busy === "patch"} onChange={(e) => patch({ priority: e.target.value }, "Priority updated.")} className={sel}>{PRIORITY.map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}</select>
          </div>
          <p className="mt-3 text-sm">
            {t.assigned_to ? `Assigned to staff #${t.assigned_to}` : "Unassigned"}{" "}
            {t.assigned_to !== me?.id && <button onClick={() => patch({ assignedTo: me.id }, "Assigned to you.")} className="font-semibold text-primary underline">Assign to me</button>}{" "}
            {t.assigned_to && <button onClick={() => patch({ assignedTo: null }, "Unassigned.")} className="font-semibold text-terracotta underline">Unassign</button>}
          </p>
        </section>
      </div>

      <section aria-label="Conversation" className="space-y-3">
        {t.messages.map((m) => (
          <article key={m.id} className={`max-w-[85%] rounded-2xl p-4 text-sm ${m.is_internal ? "border border-gold/50 bg-gold/15" : m.sender_type === "staff" ? "ml-auto bg-primary text-white" : "border border-border bg-white"}`}>
            <p className={`text-xs ${m.sender_type === "staff" && !m.is_internal ? "text-sand" : "text-muted"}`}>
              {m.is_internal ? "Internal note" : m.sender_type === "staff" ? "Our team" : "Customer"} · {formatDateTime(m.created_at)}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{m.message_text}</p>
          </article>
        ))}
      </section>

      <form onSubmit={send} className="space-y-3 rounded-3xl border border-gold/50 bg-gold/10 p-5">
        <textarea required rows={5} maxLength={10000} value={text} onChange={(e) => setText(e.target.value)} aria-label="Message"
          placeholder={internal ? "Internal note (the customer never sees this)" : "Reply to the customer. It is sent to their email."}
          className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none focus:border-accent" />
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="accent-[var(--accent)]" />Internal note only</label>
          <button disabled={busy === "send" || !text.trim()} className="btn-gold rounded-full px-7 py-2.5 text-sm font-semibold disabled:opacity-50">{busy === "send" ? "Sending…" : internal ? "Save note" : "Send reply"}</button>
        </div>
        {!internal && <p className="text-xs text-muted">Sending a reply sets the ticket to &ldquo;Waiting customer&rdquo;.</p>}
        {msg.text && <p role={msg.type === "error" ? "alert" : "status"} className={`text-sm ${msg.type === "error" ? "text-terracotta" : "text-primary"}`}>{msg.text}</p>}
      </form>
    </Container>
  );
}