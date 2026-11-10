import Link from "next/link";
import { noIndexMetadata } from "@/lib/seo";

export const metadata = { title: "Page not found", ...noIndexMetadata };

export default function NotFound() {
  return (
    <main style={{ padding: "120px 24px", textAlign: "center" }}>
      <h1>This page has wandered off</h1>
      <p>Try our <Link href="/destinations">destinations</Link> or <Link href="/tours">tours</Link>.</p>
    </main>
  );
}
