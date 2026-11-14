"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { authService } from "@/services/auth.service";

export default function AuthMenu({ tone = "text-primary", onNavigate }) {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  // "loading" is also what the server renders, so there is no hydration mismatch
  if (status === "loading") return <span aria-hidden="true" className="h-5 w-20 animate-pulse rounded bg-current/10" />;

  if (status === "guest") {
    return <Link href="/sign-in" rel="nofollow" onClick={onNavigate} className={`text-sm font-medium ${tone}`}>Sign in</Link>;
  }

  const name = (user?.fullName || user?.email || "Account").split(" ")[0];
  return (
    <div className="flex items-center gap-4">
      <Link href="/dashboard" onClick={onNavigate} className={`text-sm font-medium ${tone}`}>{name}</Link>
      <button
        type="button"
        className={`text-sm font-medium opacity-80 hover:opacity-100 ${tone}`}
        onClick={async () => { onNavigate?.(); await authService.logout(); router.push("/"); }}
      >
        Log out
      </button>
    </div>
  );
}