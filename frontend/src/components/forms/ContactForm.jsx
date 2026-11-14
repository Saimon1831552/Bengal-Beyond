"use client";
import { useState } from "react";
import Field from "@/components/ui/Field";
import api from "@/lib/axios";
import { errMsg } from "@/lib/errors";

const categories = ["general", "booking", "payment", "refund", "tour", "account", "technical", "other"];

export default function ContactForm() {
  const [f, setF] = useState({ name: "", email: "", phone: "", category: "general", subject: "", message: "" });
  const [state, setState] = useState({ busy: false, ref: "", error: "" });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, ref: "", error: "" });
    try {
      const res = await api.post("/support/enquiries", f);
      setState({ busy: false, ref: res.data?.data?.ticketReference || "sent", error: "" });
      setF({ name: "", email: "", phone: "", category: "general", subject: "", message: "" });
    } catch (err) { setState({ busy: false, ref: "", error: errMsg(err) }); }
  };

  if (state.ref) return <p role="status" className="mt-8 rounded-2xl bg-accent/10 p-6 text-primary">Thanks! Your reference is <strong>{state.ref}</strong>. We&apos;ll reply by email.</p>;

  return (
    <form onSubmit={submit} className="mt-8 space-y-4 rounded-3xl border border-border bg-white p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required value={f.name} onChange={set("name")} />
        <Field label="Email" type="email" required value={f.email} onChange={set("email")} />
        <Field label="Phone (optional)" type="tel" value={f.phone} onChange={set("phone")} />
        <label className="block text-sm font-medium">Topic
          <select className="mt-1 w-full rounded-xl border border-border bg-white px-4 py-3" value={f.category} onChange={set("category")}>
            {categories.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
          </select>
        </label>
      </div>
      <Field label="Subject" required maxLength={200} value={f.subject} onChange={set("subject")} />
      <Field as="textarea" rows={6} label="Message" required maxLength={10000} value={f.message} onChange={set("message")} />
      {state.error && <p role="alert" className="text-sm text-terracotta">{state.error}</p>}
      <button disabled={state.busy} className="btn-gold rounded-full px-8 py-3 font-semibold disabled:opacity-60">{state.busy ? "Sending…" : "Send message"}</button>
    </form>
  );
}