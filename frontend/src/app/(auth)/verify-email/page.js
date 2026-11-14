import { Suspense } from "react";
import VerifyEmail from "@/components/auth/VerifyEmail";

export const metadata = { title: "Verify email" };

export default function Page() {
  return (
    <Suspense fallback={null}>
      <VerifyEmail />
    </Suspense>
  );
}
