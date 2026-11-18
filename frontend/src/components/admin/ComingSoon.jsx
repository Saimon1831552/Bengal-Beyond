"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Container from "@/components/ui/Container";
import { flatNav } from "@/lib/navigation";

export default function ComingSoon() {
  const pathname = usePathname();
  const item = flatNav().find((i) => i.href.split("?")[0] === pathname);
  const title = item?.label || pathname.split("/").pop().replace(/-/g, " ");
  return (
    <Container as="main" className="max-w-2xl py-20 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-terracotta">{item?.group || "Admin"}</p>
      <h1 className="mt-3 text-4xl capitalize text-primary">{title}</h1>
      <p className="mt-4 text-muted">This module isn&apos;t built yet.</p>
      {item?.note && <p className="mx-auto mt-4 max-w-md rounded-2xl bg-gold/15 p-4 text-sm text-primary-dark">{item.note}</p>}
      <Link href="/admin" className="btn-gold mt-8 inline-block rounded-full px-7 py-3 text-sm font-semibold">Back to dashboard</Link>
    </Container>
  );
}