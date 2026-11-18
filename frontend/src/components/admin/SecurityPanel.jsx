"use client";
import Link from "next/link";
import useFetch from "@/hooks/useFetch";

const Tile = ({ label, value, warn }) => (
  <div className={`rounded-2xl border p-5 ${warn ? "border-terracotta/40 bg-terracotta/10" : "border-border bg-white"}`}>
    <p className="text-xs font-semibold uppercase tracking-widest text-muted">{label}</p>
    <p className="mt-2 font-display text-3xl font-semibold text-primary">{value}</p>
  </div>
);

export default function SecurityPanel() {
  const { data: s, error } = useFetch("/admin/audit-logs/summary");
  if (error || !s) return null;
  return (
    <section aria-labelledby="sec">
      <div className="flex items-center justify-between">
        <h2 id="sec" className="text-xl text-primary">Security, last 24 hours</h2>
        <Link href="/admin/activity-logs" className="text-sm font-semibold text-accent link-underline">Open logs</Link>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile label="Events" value={s.events_last_24h} />
        <Tile label="Security events" value={s.security_events_last_24h} />
        <Tile label="Failed logins" value={s.failed_login_attempts} warn={s.failed_login_attempts >= 10} />
        <Tile label="Active staff" value={s.active_actors_24h} />
      </div>
      {s.topFailedLoginIps?.length > 0 && (
        <p className="mt-3 text-sm text-muted">Most failed logins: {s.topFailedLoginIps.slice(0, 3).map((i) => `${i.ipAddress} (${i.attempts})`).join(", ")}</p>
      )}
    </section>
  );
}