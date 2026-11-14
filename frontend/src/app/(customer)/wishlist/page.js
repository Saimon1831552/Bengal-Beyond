"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Container from "@/components/ui/Container";
import { Loading, ErrorBox, Empty } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import api from "@/lib/axios";
import { money } from "@/lib/format";
import { errMsg } from "@/lib/errors";

export default function Wishlist() {
  const { data, error, loading, reload } = useFetch("/me/wishlist?limit=50");
  const [err, setErr] = useState("");

  const remove = async (tourId) => {
    setErr("");
    try { await api.delete(`/me/wishlist/${tourId}`); reload(); } catch (e) { setErr(errMsg(e)); }
  };

  return (
    <Container as="main" className="py-8">
      <h1 className="text-3xl text-primary">Wishlist</h1>
      {err && <p role="alert" className="mt-3 text-sm text-terracotta">{err}</p>}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? <Loading /> : error ? <ErrorBox error={error} onRetry={reload} /> :
          !data.length ? <div className="sm:col-span-3"><Empty>Nothing saved yet. <Link href="/tours" className="font-semibold text-primary underline">Browse tours</Link></Empty></div> :
          data.map((t) => (
            <div key={t.tour_id} className="overflow-hidden rounded-2xl border border-border bg-white">
              {t.cover_image_url && <div className="relative h-40"><Image src={t.cover_image_url} alt="" fill sizes="33vw" className="object-cover" /></div>}
              <div className="p-5">
                <Link href={`/tours/${t.slug}`} className="text-lg font-semibold text-primary link-underline">{t.title}</Link>
                <p className="mt-1 text-sm text-muted">{t.duration_days} days · {money(t.base_price, t.currency_code)}</p>
                <button onClick={() => remove(t.tour_id)} className="mt-3 text-sm font-semibold text-terracotta underline">Remove</button>
              </div>
            </div>
          ))}
      </div>
    </Container>
  );
}