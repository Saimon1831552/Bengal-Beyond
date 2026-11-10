import { noIndexMetadata } from "@/lib/seo";

// Dashboard, booking and payment pages: private, never indexed
export const metadata = { title: "My account", ...noIndexMetadata };

export default function CustomerLayout({ children }) {
  return <>{children}</>;
}
