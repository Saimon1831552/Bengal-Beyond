"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import Container from "@/components/ui/Container";
import StatusBadge from "@/components/ui/StatusBadge";
import { Loading, ErrorBox } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const pad = (n) => String(n).padStart(2, "0");

export default function AdminCalendar() {
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDay, setSelectedDay] = useState(null);

  const from = `${cursor.year}-${pad(cursor.month + 1)}-01`;
  const lastDay = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const to = `${cursor.year}-${pad(cursor.month + 1)}-${pad(lastDay)}`;

  const { data, error, loading, reload } = useFetch(`/admin/departures?from=${from}&to=${to}&limit=100`);

  const byDate = useMemo(() => {
    const map = {};
    for (const d of data || []) {
      const key = String(d.starts_at).slice(0, 10);
      (map[key] ||= []).push(d);
    }
    return map;
  }, [data]);

  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay();
  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= lastDay; day++) cells.push(day);

  const shiftMonth = (delta) => {
    setSelectedDay(null);
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
  const selectedKey = selectedDay ? `${cursor.year}-${pad(cursor.month + 1)}-${pad(selectedDay)}` : null;
  const selectedItems = selectedKey ? byDate[selectedKey] || [] : [];

  return (
    <Container as="main" className="py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl text-primary">Booking &amp; departure calendar</h1>
          <p className="mt-1 text-sm text-muted">Monthly schedule of tour departures and reserved seats.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shiftMonth(-1)} className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary">← Prev</button>
          <span className="min-w-[10rem] text-center font-semibold text-primary">{monthLabel}</span>
          <button onClick={() => shiftMonth(1)} className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary">Next →</button>
        </div>
      </div>

      {loading ? (
        <div className="mt-6"><Loading /></div>
      ) : error ? (
        <div className="mt-6"><ErrorBox error={error} onRetry={reload} /></div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-white">
          <div className="grid grid-cols-7 border-b border-border bg-background text-center text-xs font-bold uppercase tracking-wider text-muted">
            {DAYS.map((d) => (
              <div key={d} className="py-3">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y divide-border">
            {cells.map((day, idx) => {
              if (!day) return <div key={`empty-${idx}`} className="min-h-[6.5rem] bg-background/40" />;
              const key = `${cursor.year}-${pad(cursor.month + 1)}-${pad(day)}`;
              const list = byDate[key] || [];
              const active = selectedDay === day;
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setSelectedDay(day)}
                  className={`flex min-h-[6.5rem] flex-col items-start p-2 text-left transition hover:bg-primary/5 ${active ? "bg-gold/15 ring-2 ring-inset ring-accent" : ""}`}
                >
                  <span className="text-xs font-semibold text-primary">{day}</span>
                  <div className="mt-1 w-full space-y-1">
                    {list.slice(0, 3).map((d) => (
                      <div
                        key={d.id}
                        className={`truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${
                          d.status === "cancelled"
                            ? "bg-terracotta/15 text-terracotta"
                            : d.status === "sold_out"
                            ? "bg-gold/25 text-primary-dark"
                            : "bg-accent/15 text-primary"
                        }`}
                      >
                        {d.tour_title} ({d.seats_reserved}/{d.seat_capacity})
                      </div>
                    ))}
                    {list.length > 3 && <span className="block text-[10px] font-semibold text-muted">+{list.length - 3} more</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedKey && (
        <section className="mt-6 rounded-2xl border border-border bg-white p-5">
          <h2 className="text-lg text-primary">Departures on {selectedKey}</h2>
          {!selectedItems.length ? (
            <p className="mt-2 text-sm text-muted">No departures scheduled on this date.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border text-sm">
              {selectedItems.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <Link href={`/admin/tours/${d.tour_id}`} className="font-semibold text-primary underline">
                      {d.tour_title}
                    </Link>
                    <span className="ml-2 text-xs text-muted">
                      {d.seats_reserved}/{d.seat_capacity} seats reserved ({d.seats_available} open)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge value={d.status} />
                    <Link href="/admin/bookings" className="text-xs font-semibold text-accent underline">
                      View bookings →
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </Container>
  );
}