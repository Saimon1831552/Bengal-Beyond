"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Container from "@/components/ui/Container";
import Field, { inputCls } from "@/components/ui/Field";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/useAuthStore";
import { money, formatDate } from "@/lib/format";
import { errMsg } from "@/lib/errors";

const blank = () => ({ traveler_name: "", traveler_type: "adult", nationality: "" });

export default function BookingWizard() {
  const router = useRouter();
  const slug = useSearchParams().get("tour");
  const user = useAuthStore((s) => s.user);

  const [tour, setTour] = useState(null);
  const [deps, setDeps] = useState([]);
  const [loading, setLoading] = useState(!!slug);
  const [loadErr, setLoadErr] = useState(null);

  const [depId, setDepId] = useState(null);
  const [qty, setQty] = useState(1);
  const [travelers, setTravelers] = useState([blank()]);
  const [contact, setContact] = useState({ name: "", email: "", phone: "", nationality: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const keyRef = useRef({ sig: "", key: "" });
  const prefilled = useRef(false);

  // load tour + open departures
  useEffect(() => {
    if (!slug) return;
    let alive = true;
    (async () => {
      try {
        const t = (await api.get(`/tours/${encodeURIComponent(slug)}`)).data.data;
        const d = (await api.get(`/tours/${t.id}/departures?availableOnly=true`)).data.data || [];
        if (!alive) return;
        const now = Date.now();
        setTour(t);
        setDeps(d.filter((x) => x.status === "scheduled" && Number(x.seats_available) > 0 && new Date(x.starts_at).getTime() > now));
      } catch (e) { if (alive) setLoadErr(e); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [slug]);

  // prefill from the account once
  useEffect(() => {
    if (!user || prefilled.current) return;
    prefilled.current = true;
    setContact((c) => ({ ...c, name: user.fullName || "", email: user.email || "", phone: user.phone || "", nationality: user.nationality || "" }));
    setTravelers((t) => [{ ...t[0], traveler_name: user.fullName || "", nationality: user.nationality || "" }, ...t.slice(1)]);
  }, [user]);

  if (!slug) return <Container as="main" className="py-10"><Empty>Choose a tour first. <Link href="/tours" className="font-semibold text-primary underline">Browse tours</Link></Empty></Container>;
  if (loading) return <Container className="py-10"><Loading /></Container>;
  if (loadErr) return <Container className="py-10"><ErrorBox error={loadErr} /></Container>;

  const dep = deps.find((d) => d.id === depId);
  const maxQty = dep ? Math.min(20, Number(dep.seats_available)) : 20;
  const unit = dep ? Number(dep.price_override ?? tour.base_price) : Number(tour.base_price);
  const total = unit * qty;

  const changeQty = (n) => {
    const q = Math.max(1, Math.min(maxQty, n));
    setQty(q);
    setTravelers((t) => Array.from({ length: q }, (_, i) => t[i] || blank()));
  };
  const setTraveler = (i, k, v) => setTravelers((t) => t.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const setC = (k) => (e) => setContact({ ...contact, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!dep) return setError("Please choose a departure date.");
    const payload = {
      departure_id: dep.id,
      quantity: qty,
      customer_name: contact.name.trim(),
      customer_email: contact.email.trim(),
      customer_phone: contact.phone.trim(),
      customer_nationality: contact.nationality.trim() || null,
      travelers: travelers.map((t) => ({ traveler_name: t.traveler_name.trim(), traveler_type: t.traveler_type, nationality: t.nationality.trim() || null })),
    };
    // Same payload => same key (safe retry). Changed payload => new key, otherwise the API answers 409.
    const sig = JSON.stringify(payload);
    if (keyRef.current.sig !== sig) keyRef.current = { sig, key: crypto.randomUUID() };

    setBusy(true); setError("");
    try {
      const res = await api.post("/bookings", payload, { headers: { "Idempotency-Key": keyRef.current.key } });
      router.push(`/bookings/${res.data.booking.id}`); // NOTE: this endpoint returns {booking} at top level, not under data
    } catch (err) { setError(errMsg(err)); }
    finally { setBusy(false); }
  };

  const card = "rounded-3xl border border-border bg-white p-6";
  return (
    <Container as="main" className="py-8">
      <Link href={`/tours/${tour.slug}`} className="text-sm text-accent link-underline">← {tour.title}</Link>
      <h1 className="mt-3 text-3xl text-primary">Book: {tour.title}</h1>

      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className={card}>
            <h2 className="text-xl text-primary">1. Departure</h2>
            {!deps.length ? <p className="mt-3 text-sm text-muted">No upcoming departures with free seats. Please <Link href="/contact" className="font-semibold underline">contact us</Link>.</p> : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Departure date">
                {deps.map((d) => (
                  <label key={d.id} className={`cursor-pointer rounded-2xl border p-4 transition ${depId === d.id ? "border-accent bg-accent/10 ring-2 ring-accent/30" : "border-border hover:border-accent/50"}`}>
                    <input type="radio" name="dep" className="sr-only" checked={depId === d.id} onChange={() => { setDepId(d.id); changeQty(Math.min(qty, Number(d.seats_available))); }} />
                    <p className="font-semibold text-primary">{formatDate(d.starts_at)}</p>
                    <p className="text-sm text-muted">to {formatDate(d.ends_at)}</p>
                    <p className="mt-2 text-sm">{money(d.price_override ?? tour.base_price, tour.currency_code)} / person · {d.seats_available} seats left</p>
                  </label>
                ))}
              </div>
            )}
            <div className="mt-5 flex items-center gap-4">
              <span className="text-sm font-medium">Travellers</span>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => changeQty(qty - 1)} disabled={qty <= 1} className="h-9 w-9 rounded-full border border-primary text-primary disabled:opacity-40" aria-label="Fewer travellers">−</button>
                <span className="w-6 text-center font-semibold" aria-live="polite">{qty}</span>
                <button type="button" onClick={() => changeQty(qty + 1)} disabled={qty >= maxQty} className="h-9 w-9 rounded-full border border-primary text-primary disabled:opacity-40" aria-label="More travellers">+</button>
              </div>
            </div>
          </section>

          <section className={card}>
            <h2 className="text-xl text-primary">2. Traveller details</h2>
            <div className="mt-4 space-y-5">
              {travelers.map((t, i) => (
                <fieldset key={i} className="grid gap-3 sm:grid-cols-3">
                  <legend className="mb-1 text-sm font-semibold text-primary">Traveller {i + 1}</legend>
                  <Field label="Full name" required maxLength={160} value={t.traveler_name} onChange={(e) => setTraveler(i, "traveler_name", e.target.value)} />
                  <label className="block text-sm font-medium">Type
                    <select className={inputCls} value={t.traveler_type} onChange={(e) => setTraveler(i, "traveler_type", e.target.value)}>
                      <option value="adult">Adult</option><option value="child">Child</option><option value="infant">Infant</option>
                    </select>
                  </label>
                  <Field label="Nationality" maxLength={100} value={t.nationality} onChange={(e) => setTraveler(i, "nationality", e.target.value)} />
                </fieldset>
              ))}
            </div>
          </section>

          <section className={card}>
            <h2 className="text-xl text-primary">3. Contact</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Name" required maxLength={160} value={contact.name} onChange={setC("name")} />
              <Field label="Email" type="email" required value={contact.email} onChange={setC("email")} />
              <Field label="Phone" type="tel" required maxLength={30} hint="Include country code." value={contact.phone} onChange={setC("phone")} />
              <Field label="Nationality (optional)" maxLength={100} value={contact.nationality} onChange={setC("nationality")} />
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-3xl border border-border bg-white p-6 lg:sticky lg:top-24">
          <h2 className="text-xl text-primary">Summary</h2>
          <p className="text-sm text-muted">{dep ? `${formatDate(dep.starts_at)} – ${formatDate(dep.ends_at)}` : "Choose a departure"}</p>
          <div className="flex justify-between text-sm"><span>{qty} × {money(unit, tour.currency_code)}</span><span>{money(total, tour.currency_code)}</span></div>
          <div className="flex justify-between border-t border-border pt-3 text-lg font-semibold text-primary"><span>Estimated total</span><span>{money(total, tour.currency_code)}</span></div>
          <p className="text-xs text-muted">Seats are held for 15 minutes after you reserve. You can apply a coupon and pay on the next page. The final total is calculated by our server.</p>
          {error && <p role="alert" className="text-sm text-terracotta">{error}</p>}
          <button disabled={busy || !deps.length} className="btn-gold w-full rounded-full px-6 py-3 font-semibold disabled:opacity-60">{busy ? "Reserving…" : "Reserve seats"}</button>
        </aside>
      </form>
    </Container>
  );
}