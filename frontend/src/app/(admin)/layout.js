import { noIndexMetadata } from "@/lib/seo";

// Everything inside (admin) is private: keep it out of search results
export const metadata = { title: "Admin", ...noIndexMetadata };

export default function AdminLayout({ children }) {
  return <>{children}</>;
}
