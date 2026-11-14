import { noIndexMetadata } from "@/lib/seo";
import RequireAuth from "@/components/auth/RequireAuth";
import AdminShell from "@/components/admin/AdminShell";

export const metadata = { title: "Admin", ...noIndexMetadata };

export default function AdminLayout({ children }) {
  return <RequireAuth><AdminShell>{children}</AdminShell></RequireAuth>;
}