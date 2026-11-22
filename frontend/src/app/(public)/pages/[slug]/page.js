"use client";
import { useParams } from "next/navigation";
import Container from "@/components/ui/Container";
import { Loading, ErrorBox } from "@/components/account/State";
import useFetch from "@/hooks/useFetch";
import { formatDate } from "@/lib/format";

export default function CmsPublicPage() {
  const { slug } = useParams();
  const { data, error, loading, reload } = useFetch(slug ? `/public/pages/${slug}` : null);

  if (loading) return <Container as="main" className="py-12"><Loading /></Container>;
  if (error) return <Container as="main" className="py-12"><ErrorBox error={error} onRetry={reload} /></Container>;
  if (!data) return null;

  return (
    <Container as="main" className="py-12">
      <article className="mx-auto max-w-3xl rounded-2xl border border-border bg-white p-8 sm:p-10">
        <h1 className="font-display text-3xl text-primary sm:text-4xl">{data.title}</h1>
        <p className="mt-2 text-xs text-muted">Last updated {formatDate(data.updated_at)}</p>

        <div className="mt-6 whitespace-pre-line text-sm leading-relaxed text-primary">
          {data.body}
        </div>
      </article>
    </Container>
  );
}