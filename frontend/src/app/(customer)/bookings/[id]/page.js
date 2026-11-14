import BookingDetail from "@/components/account/BookingDetail";

export default async function Page({ params }) {
  const { id } = await params;
  return <BookingDetail id={id} />;
}