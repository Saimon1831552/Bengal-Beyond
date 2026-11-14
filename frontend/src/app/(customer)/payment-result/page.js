import { Suspense } from "react";
import PaymentResult from "@/components/account/PaymentResult";
export default function Page() { return <Suspense fallback={null}><PaymentResult /></Suspense>; }