import Link from "next/link";
import { noIndexMetadata } from "@/lib/seo";
import RequireAuth from "@/components/auth/RequireAuth";
import Container from "@/components/ui/Container";

export const metadata = { title: "My account", ...noIndexMetadata };

const nav = [["/dashboard", "Overview"], ["/bookings", "Bookings"], ["/payments", "Payments"], ["/wishlist", "Wishlist"]];

export default function CustomerLayout({ children }) {
  return (
    <RequireAuth>
      <Container className="pt-8">
        <nav aria-label="Account" className="flex gap-2 overflow-x-auto border-b border-border pb-3">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10">{label}</Link>
          ))}
        </nav>
      </Container>
      {children}
    </RequireAuth>
  );
}