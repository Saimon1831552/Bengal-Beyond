"use client";
import { useState } from "react";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";

function One({ bookingId, item }) {
  const title = (() => { try { return (typeof item.tour_snapshot === "string" ? JSON.parse(item.tour_snapshot) : item.tour_snapshot)?.title; } catch { return null; } })() || `Tour #${item.tour_id}`;
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [state, setState] = useState({ busy: false, done: false, error: "" });

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, done: false, error: "" });
    try {
      await api.post(`/tours/${item.tour_id}/reviews`, { rating, bookingId, ...(text.trim() && { reviewText: text.trim() }) });
      setState({ busy: false, done: true, error: "" });
    } catch (err) { setState({ busy: false, done: false, error: errMsg(err) }); }
  };

  if (state.done) return <p role="status" className="rounded-xl bg-accent/10 p-4 text-sm text-primary">Thank you! Your review for {title} will appear once our team has checked it.</p>;
  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border border-border bg-white p-5">
      <p className="font-semibold text-primary">How was {title}?</p>
      <div role="radiogroup" aria-label="Rating" className="flex gap-1 text-3xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} onClick={() => setRating(n)} className={n <= rating ? "text-gold" : "text-border"}>★</button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={5000} rows={4} aria-label="Your review (optional)" placeholder="Tell other travellers what it was like (optional)"
        className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:border-accent" />
      {state.error && <p role="alert" className="text-sm text-terracotta">{state.error}</p>}
      <button disabled={!rating || state.busy} className="btn-gold rounded-full px-6 py-2.5 text-sm font-semibold disabled:opacity-50">{state.busy ? "Sending…" : "Submit review"}</button>
    </form>
  );
}

export default function ReviewPrompt({ booking, items }) {
  if (booking.booking_status !== "completed") return null;
  return (
    <section className="mt-8 space-y-4">
      <h2 className="text-xl text-primary">Review your trip</h2>
      {items.map((it) => <One key={it.id} bookingId={booking.id} item={it} />)}
    </section>
  );
}