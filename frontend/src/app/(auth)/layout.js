import { noIndexMetadata } from "@/lib/seo";

export const metadata = { title: "Account", ...noIndexMetadata };

export default function AuthLayout({ children }) {
  return <>{children}</>;
}
