import AdminTourEdit from "@/components/admin/AdminTourEdit";
export default async function Page({ params }) {
  const { id } = await params;
  return <AdminTourEdit id={id} />;
}