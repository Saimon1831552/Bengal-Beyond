import { notFound } from "next/navigation";
import Container from "@/components/ui/Container";
import Breadcrumbs from "@/components/seo/Breadcrumbs";
import { buildMetadata } from "@/lib/seo";
import { formatDate } from "@/lib/format";

export const revalidate = 300;

const API_BASE =
  process.env.INTERNAL_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000/api";

async function fetchCmsPage(slug) {
  try {
    const res = await fetch(`${API_BASE}/public/pages/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data || null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = await fetchCmsPage(slug);
  if (!page) return {};
  return buildMetadata({
    title: page.seo_title || page.title,
    description: page.seo_description || page.body?.slice(0, 160),
    path: `/pages/${page.slug}`,
  });
}

export default async function CmsPublicPage({ params }) {
  const { slug } = await params;
  const data = await fetchCmsPage(slug);
  if (!data) notFound();

  return (
    <main>
      <Container className="pt-6">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: data.title, path: `/pages/${data.slug}` },
          ]}
        />
      </Container>

      <Container className="py-10">
        <article className="mx-auto max-w-3xl rounded-2xl border border-border bg-white p-8 sm:p-10">
          <h1 className="font-display text-3xl text-primary sm:text-4xl">{data.title}</h1>
          {data.updated_at && (
            <p className="mt-2 text-xs text-muted">Last updated {formatDate(data.updated_at)}</p>
          )}

          <div className="mt-6 space-y-4 whitespace-pre-line text-sm leading-relaxed text-primary">
            {data.body}
          </div>
        </article>
      </Container>
    </main>
  );
}