"use client";
import Container from "@/components/ui/Container";
import { Loading, ErrorBox } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";

export default function AdminPermissions() {
  const roles = useFetch("/admin/roles?limit=100");
  const perms = useFetch("/admin/roles/permissions");
  if (roles.loading || perms.loading) return <Container className="py-8"><Loading /></Container>;
  if (roles.error || perms.error) return <Container className="py-8"><ErrorBox error={roles.error || perms.error} /></Container>;
  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Permissions</h1>
      <p className="mt-2 text-sm text-muted">Read-only matrix. Edit under Staff &amp; Roles.</p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wider text-muted">
            <tr><th className="px-4 py-3 text-left">Permission</th>{roles.data.map((r) => <th key={r.id} className="px-3 text-center">{r.name}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {perms.data.map((p) => (
              <tr key={p.permission_key}>
                <td className="px-4 py-2"><span className="font-mono text-xs text-primary">{p.permission_key}</span><br /><span className="text-xs text-muted">{p.description}</span></td>
                {roles.data.map((r) => <td key={r.id} className="text-center">{r.permissions.includes(p.permission_key) ? <span className="text-accent" aria-label="Granted">✓</span> : <span className="text-border" aria-label="Not granted">–</span>}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
}