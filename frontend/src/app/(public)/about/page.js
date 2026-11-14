import Container from "@/components/ui/Container";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { buildMetadata } from "@/lib/seo";
import { siteConfig } from "@/config/site";

export const metadata = buildMetadata({ title: "About us", description: `About ${siteConfig.name}: locally led tours across Bangladesh.`, path: "/about" });

export default function About() {
  return (
    <Container as="main" className="max-w-3xl py-10">
      <Breadcrumbs items={[{ name: "Home", path: "/" }, { name: "About", path: "/about" }]} />
      <h1 className="mt-4 text-4xl text-primary">About {siteConfig.name}</h1>
      <div className="mt-6 space-y-4 text-muted">
        <p>{siteConfig.description}</p>
        <p>We design small-group journeys through mangrove forests, tea hills, ancient ruins and living cities, led by guides who call these places home.</p>
        <p>{/* TODO: add your real story, team and licences here */}</p>
      </div>
    </Container>
  );
}