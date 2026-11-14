import { Suspense } from "react";
import BookingWizard from "@/components/booking/BookingWizard";

export const metadata = { title: "Book a tour" };

export default function Page() {
  return <Suspense fallback={null}><BookingWizard /></Suspense>;
}
