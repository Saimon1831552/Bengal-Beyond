import { noIndexMetadata } from "@/lib/seo";
import RequireAuth from "@/components/auth/RequireAuth";
import CustomerShell from "@/components/account/CustomerShell";

export const metadata = { title: "My account", ...noIndexMetadata };

export default function CustomerLayout({ children }) {
  return <RequireAuth><CustomerShell>{children}</CustomerShell></RequireAuth>;
}
