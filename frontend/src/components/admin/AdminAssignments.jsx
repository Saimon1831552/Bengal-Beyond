"use client";
import { useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { formatDateTime, titleCase } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm";

export default function AdminAssignments() {
  const { data: staff } = useFetch("/admin/guides");
  const { data: tours } = useFetch("/admin/tours?limit=100");
  const { data: bookings } = useFetch("/admin/bookings?limit=100");
  const [filterType, setFilterType] = useState("");
  const qs = filterType ? `?entity_type=${filterType}` : "";
  const { data, error, loading, reload } = useFetch(`/admin/assignments${qs}`);

  const [form, setForm] = useState({ entity_type: "tour", entity_id: "", staff_user_id: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      await api.post("/admin/assignments", {
        entity_type: form.entity_type,
        entity_id: Number(form.entity_id),
        staff_user_id: Number(form.staff_user_id),
      });
      setForm({ ...form, entity_id: "" });
      setMsg({ type: "ok", text: "Staff member assigned." });
      await reload();
    } catch (err) {
      setMsg({ type: "error", text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Unassign ${a.staff_name} from ${a.entity_label}?`)) return;
    await api.delete(`/admin/assignments/${a.id}`);
    await reload();
  };

  return (
    <Container as="main" className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-primary">Tour &amp; staff assignments</h1>
          <p className="mt-1 text-sm text-muted">Assign tour guides, operators, or coordinators to tours, bookings, and enquiries.</p>
        </div>
        <select
          aria-label="Filter by type"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="rounded-xl border border-border bg-white px-3 py-2 text-sm"
        >
          <option value="">All assignment types</option>
          <option value="tour">Tours</option>
          <option value="booking">Bookings</option>
          <option value="enquiry">Enquiries</option>
        </select>
      </div>

      <form onSubmit={create} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-6 sm:grid-cols-3">
        <label className="text-xs font-semibold">
          Record type
          <select
            value={form.entity_type}
            onChange={(e) => setForm({ ...form, entity_type: e.target.value, entity_id: "" })}
            className={inp}
          >
            <option value="tour">Tour</option>
            <option value="booking">Booking</option>
            <option value="enquiry">Enquiry (by ID)</option>
          </select>
        </label>

        <label className="text-xs font-semibold">
          {form.entity_type === "tour" ? "Select tour *" : form.entity_type === "booking" ? "Select booking *" : "Enquiry ID *"}
          {form.entity_type === "tour" ? (
            <select required value={form.entity_id} onChange={(e) => setForm({ ...form, entity_id: e.target.value })} className={inp}>
              <option value="">Choose tour…</option>
              {(tours || []).map((t) => (
                <option key={t.id} value={t.id}>#{t.id} — {t.title}</option>
              ))}
            </select>
          ) : form.entity_type === "booking" ? (
            <select required value={form.entity_id} onChange={(e) => setForm({ ...form, entity_id: e.target.value })} className={inp}>
              <option value="">Choose booking…</option>
              {(bookings || []).map((b) => (
                <option key={b.id} value={b.id}>{b.booking_reference} — {b.customer_name}</option>
              ))}
            </select>
          ) : (
            <input type="number" min={1} required placeholder="Enquiry ID" value={form.entity_id} onChange={(e) => setForm({ ...form, entity_id: e.target.value })} className={inp} />
          )}
        </label>

        <label className="text-xs font-semibold">
          Staff / Guide *
          <select required value={form.staff_user_id} onChange={(e) => setForm({ ...form, staff_user_id: e.target.value })} className={inp}>
            <option value="">Choose staff member…</option>
            {(staff || []).map((s) => (
              <option key={s.id} value={s.id}>{s.full_name} ({s.roles})</option>
            ))}
          </select>
        </label>

        {msg.text && (
          <p className={`text-sm sm:col-span-3 ${msg.type === "error" ? "text-terracotta" : "text-primary"}`}>
            {msg.text}
          </p>
        )}

        <div className="sm:col-span-3">
          <button disabled={busy} className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50">
            {busy ? "Assigning…" : "Assign staff"}
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? (
          <div className="p-6"><Loading /></div>
        ) : error ? (
          <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div>
        ) : !data.length ? (
          <div className="p-6"><Empty>No staff assignments yet.</Empty></div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Type</th>
                <th>Target Record</th>
                <th>Assigned Staff</th>
                <th>Assigned By</th>
                <th>Assigned At</th>
                <th className="pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((a) => (
                <tr key={a.id} className="hover:bg-primary/5">
                  <td className="px-5 py-3 font-medium">{titleCase(a.entity_type)}</td>
                  <td>
                    {a.entity_type === "tour" ? (
                      <Link href={`/admin/tours/${a.entity_id}`} className="font-semibold text-primary underline">{a.entity_label}</Link>
                    ) : a.entity_type === "booking" ? (
                      <Link href={`/admin/bookings/${a.entity_id}`} className="font-semibold text-primary underline">{a.entity_label}</Link>
                    ) : (
                      <span className="font-semibold text-primary">{a.entity_label}</span>
                    )}
                  </td>
                  <td>
                    <span className="font-semibold text-primary">{a.staff_name}</span>
                    <span className="block text-xs text-muted">{a.staff_email}</span>
                  </td>
                  <td className="text-muted">{a.assigned_by_name || "—"}</td>
                  <td className="whitespace-nowrap">{formatDateTime(a.created_at)}</td>
                  <td className="pr-5 text-right text-xs font-semibold">
                    <button onClick={() => remove(a)} className="text-terracotta underline">Unassign</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Container>
  );
}