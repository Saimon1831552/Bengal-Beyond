"use client";

import { useEffect, useState } from "react";
import Container from "@/components/ui/Container";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/components/ui/ToastProvider";
import { Loading, ErrorBox } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";

const inp = "mt-1 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm";

function Editor({ role, perms, onSaved }) {
  const toast = useToast();
  const isNew = role === "new";
  const [sel, setSel] = useState(new Set(isNew ? [] : role.permissions));
  const [meta, setMeta] = useState({ key: "", name: "", description: "" });
  const [uid, setUid] = useState("");
  const [busy, setBusy] = useState(false);
  const [removeUserTarget, setRemoveUserTarget] = useState(null);
  const users = useFetch(isNew ? null : `/admin/roles/${role.id}/users?limit=100`);

  useEffect(() => { setSel(new Set(isNew ? [] : role.permissions)); }, [role, isNew]);
  const locked = !isNew && role.isSystem;

  const groups = perms.reduce((m, p) => ((m[p.permission_key.split(".")[0]] ||= []).push(p), m), {});
  const flip = (k) => setSel((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; });

  const run = async (fn, ok) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      await onSaved();
      await users.reload?.();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const save = () => run(() => isNew
    ? api.post("/admin/roles", { key: meta.key.trim(), name: meta.name.trim(), ...(meta.description && { description: meta.description }), permissions: [...sel] })
    : api.put(`/admin/roles/${role.id}/permissions`, { permissions: [...sel] }), "Role permissions saved.");

  return (
    <div className="space-y-6 rounded-2xl border border-border bg-white p-6">
      {isNew ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium">Key<input className={inp} value={meta.key} onChange={(e) => setMeta({ ...meta, key: e.target.value })} placeholder="finance_manager" pattern="[a-z][a-z0-9_]*" /></label>
          <label className="text-sm font-medium">Name<input className={inp} value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} /></label>
          <label className="text-sm font-medium">Description<input className={inp} value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} /></label>
        </div>
      ) : (
        <div><h2 className="text-xl text-primary">{role.name}</h2><p className="text-sm text-muted">{role.role_key}{role.description ? ` · ${role.description}` : ""}</p></div>
      )}
      {locked && <p className="rounded-xl bg-gold/15 p-3 text-sm">System roles can&apos;t be modified.</p>}

      <fieldset disabled={locked} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(groups).map(([g, list]) => (
          <div key={g}>
            <p className="text-xs font-bold uppercase tracking-widest text-muted">{g}</p>
            {list.map((p) => (
              <label key={p.permission_key} title={p.description} className="mt-1 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={sel.has(p.permission_key)} onChange={() => flip(p.permission_key)} className="accent-[var(--accent)]" />{p.permission_key}
              </label>
            ))}
          </div>
        ))}
      </fieldset>
      {!locked && <button onClick={save} disabled={busy || (isNew && (!meta.key || !meta.name))} className="btn-gold rounded-full px-7 py-2.5 text-sm font-semibold disabled:opacity-50">{busy ? "Saving…" : isNew ? "Create role" : "Save permissions"}</button>}

      {!isNew && !locked && (
        <div className="border-t border-border pt-5">
          <h3 className="text-lg text-primary">Staff with this role</h3>
          <ul className="mt-2 divide-y divide-border text-sm">
            {(users.data || []).map((u) => (
              <li key={u.id} className="flex items-center justify-between py-2">
                <span>{u.full_name} <span className="text-muted">· {u.email} · #{u.id}</span></span>
                <button onClick={() => setRemoveUserTarget(u)} className="text-xs font-semibold text-terracotta underline">Remove</button>
              </li>
            ))}
            {!(users.data || []).length && <li className="py-2 text-muted">Nobody yet.</li>}
          </ul>
          <form onSubmit={(e) => { e.preventDefault(); run(() => api.put(`/admin/roles/${role.id}/users/${uid.trim()}`), "Staff assigned.").then(() => setUid("")); }} className="mt-3 flex gap-3">
            <input value={uid} onChange={(e) => setUid(e.target.value)} inputMode="numeric" pattern="\d+" placeholder="User ID" aria-label="User ID" className="w-32 rounded-xl border border-border px-3 py-2 text-sm" />
            <button disabled={!uid || busy} className="rounded-full border border-primary px-5 py-2 text-sm font-semibold text-primary disabled:opacity-40">Assign</button>
          </form>
        </div>
      )}

      <ConfirmModal
        open={Boolean(removeUserTarget)}
        tone="danger"
        title="Remove staff from role?"
        description={removeUserTarget ? `Remove ${removeUserTarget.full_name} from ${role.name}?` : ""}
        confirmLabel="Remove"
        busy={busy}
        onConfirm={async () => {
          const u = removeUserTarget;
          setRemoveUserTarget(null);
          if (u) await run(() => api.delete(`/admin/roles/${role.id}/users/${u.id}`), "Removed from role.");
        }}
        onCancel={() => setRemoveUserTarget(null)}
      />
    </div>
  );
}

export default function AdminRoles() {
  const roles = useFetch("/admin/roles?limit=100");
  const perms = useFetch("/admin/roles/permissions");
  const [pick, setPick] = useState(null);
  if (roles.loading || perms.loading) return <Container className="py-8"><Loading /></Container>;
  if (roles.error || perms.error) return <Container className="py-8"><ErrorBox error={roles.error || perms.error} onRetry={() => { roles.reload(); perms.reload(); }} /></Container>;
  const current = pick === "new" ? "new" : roles.data.find((r) => r.id === pick);

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Staff &amp; Roles</h1>
      <p className="mt-2 text-sm text-muted">You can only grant permissions you hold yourself. Only a Super Admin can delegate role management.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <ul className="space-y-2">
          {roles.data.map((r) => (
            <li key={r.id}><button onClick={() => setPick(r.id)} className={`w-full rounded-xl border px-4 py-3 text-left text-sm ${pick === r.id ? "border-accent bg-accent/10" : "border-border bg-white"}`}>
              <span className="font-semibold text-primary">{r.name}</span><br /><span className="text-xs text-muted">{r.permission_count} permissions{r.isSystem ? " · system" : ""}</span></button></li>
          ))}
          <li><button onClick={() => setPick("new")} className="w-full rounded-xl border border-dashed border-primary px-4 py-3 text-sm font-semibold text-primary">+ New role</button></li>
        </ul>
        {current ? <Editor key={current === "new" ? "new" : current.id} role={current} perms={perms.data} onSaved={roles.reload} /> : <p className="text-muted">Select a role.</p>}
      </div>
    </Container>
  );
}