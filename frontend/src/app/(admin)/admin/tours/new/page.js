import Container from "@/components/ui/Container";
import TourForm from "@/components/admin/TourForm";
export default function Page() {
  return <Container as="main" className="max-w-3xl py-8"><h1 className="mb-6 text-3xl text-primary">New tour</h1><TourForm /></Container>;
}