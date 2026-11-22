import AdminBookingDetail from "@/components/admin/AdminBookingDetail";
export default async function Page({ params }) {
  const { id } = await params;
  return <AdminBookingDetail id={id} />;
}