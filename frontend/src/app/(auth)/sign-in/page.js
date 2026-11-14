import { Suspense } from "react";
import Container from "@/components/ui/Container";
import SignInForm from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <Container as="main" className="py-10">
      <Suspense fallback={null}><SignInForm /></Suspense>
    </Container>
  );
}