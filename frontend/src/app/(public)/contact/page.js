import Container from "@/components/ui/Container";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import ContactForm from "@/components/forms/ContactForm";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({ title: "Contact us", description: "Questions about a tour or booking? Send us a message.", path: "/contact" });

export default function Contact() {
  return (
    <Container as="main" className="max-w-2xl py-10">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "Contact", path: "/contact" }]} />
      <h1 className="mt-4 text-4xl text-primary">Contact us</h1>
      <p className="mt-3 text-muted">We usually reply within one working day.</p>
      <ContactForm />
    </Container>
  );
}