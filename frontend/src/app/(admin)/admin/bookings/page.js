import { Suspense } from "react";
import AdminBookings from "@/components/admin/AdminBookings";
export default function Page() { return <Suspense fallback={null}><AdminBookings /></Suspense>; }