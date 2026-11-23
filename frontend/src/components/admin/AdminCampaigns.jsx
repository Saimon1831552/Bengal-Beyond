"use client";
import { useState } from "react";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { formatDateTime, titleCase } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm";

export default function AdminCampaigns() {
  const toast = useToast();
  const { data, error, loading, reload } = useFetch("/admin/campaigns");
  const [form, setForm] = useState({ name: "", subject: "", audience: "all_subscribers", body_html: "" });
  const [busy, setBusy] = useState(false);
  const [sendingTarget, setSendingTarget] = useState(null);
  const [dispatching, setDispatching] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/admin/campaigns", form);
      setForm({ name: "", subject: "", audience: "all_subscribers", body_html: "" });
      toast.success("Campaign draft saved.");
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmDispatch = async () => {
    if (!sendingTarget) return;
    setDispatching(true);
    try {
      const res = await api.post(`/admin/campaigns/${sendingTarget.id}/send`);
      toast.success(`Queued ${res.data?.data?.queued ?? 0} emails in the notification worker.`);
      setSendingTarget(null);
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setDispatching(false);
    }
  };

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Email campaigns</h1>
      <p className="mt-1 text-sm text-muted">Draft promotional blasts and queue them into your background email worker.</p>

      <form onSubmit={create} className="mt-6 grid gap-4 rounded-2xl border border-border bg-white p-6 sm:grid-cols-3">
        <label className="text-xs font-semibold">
          Campaign name *
          <input required placeholder="Winter Sundarbans Early Bird" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Email subject *
          <input required placeholder="15% Off December Mangrove Expeditions" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inp} />
        </label>

        <label className="text-xs font-semibold">
          Audience
          <select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} className={inp}>
            <option value="all_subscribers">Newsletter Subscribers</option>
            <option value="all_customers">All Registered Customers</option>
          </select>
        </label>

        <label className="text-xs font-semibold sm:col-span-3">
          Email HTML / body *
          <textarea rows={4} required placeholder="<p>Explore Bangladesh this winter...</p>" value={form.body_html} onChange={(e) => setForm({ ...form, body_html: e.target.value })} className={inp} />
        </label>

        <div className="sm:col-span-3">
          <button disabled={busy} className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50">
            {busy ? "Saving…" : "Save draft"}
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        {loading ? <div className="p-6"><Loading /></div> : error ? <div className="p-6"><ErrorBox error={error} onRetry={reload} /></div> : !data.length ? <div className="p-6"><Empty>No email campaigns yet.</Empty></div> : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3">Campaign</th>
                <th>Audience</th>
                <th>Recipients</th>
                <th>Status</th>
                <th>Sent At</th>
                <th className="pr-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((c) => (
                <tr key={c.id} className="hover:bg-primary/5">
                  <td className="px-5 py-3">
                    <span className="font-semibold text-primary">{c.name}</span>
                    <span className="block text-xs text-muted">{c.subject}</span>
                  </td>
                  <td>{titleCase(c.audience)}</td>
                  <td>{c.recipients_count}</td>
                  <td><StatusBadge value={c.status} /></td>
                  <td>{c.sent_at ? formatDateTime(c.sent_at) : "—"}</td>
                  <td className="pr-5 text-right text-xs font-semibold">
                    {c.status === "draft" && (
                      <button onClick={() => setSendingTarget(c)} className="btn-gold rounded-full px-4 py-1.5 text-xs font-semibold">
                        Queue &amp; Send
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        open={Boolean(sendingTarget)}
        tone="primary"
        title="Queue email campaign?"
        description={
          sendingTarget
            ? `This will queue "${sendingTarget.name}" (${sendingTarget.subject}) to ${titleCase(sendingTarget.audience)} for immediate delivery by the notification worker.`
            : ""
        }
        confirmLabel="Queue & Send"
        busy={dispatching}
        onConfirm={confirmDispatch}
        onCancel={() => setSendingTarget(null)}
      />
    </Container>
  );
}