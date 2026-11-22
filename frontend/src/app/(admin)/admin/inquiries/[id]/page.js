import AdminInquiryDetail from "@/components/admin/AdminInquiryDetail";

export default async function Page({ params }) {
  const { id } = await params;
  return <AdminInquiryDetail id={id} />;
}