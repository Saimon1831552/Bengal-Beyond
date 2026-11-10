import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbJsonLd } from "@/lib/jsonld";

/** Visible breadcrumb trail + matching BreadcrumbList schema. items: [{name, path}] */
export default function Breadcrumbs({ items }) {
  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol style={{ display: "flex", gap: 8, listStyle: "none", padding: 0, flexWrap: "wrap" }}>
          {items.map((item, i) => (
            <li key={item.path}>
              {i < items.length - 1 ? <Link href={item.path}>{item.name}</Link> : <span aria-current="page">{item.name}</span>}
              {i < items.length - 1 && <span aria-hidden="true"> /</span>}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd data={breadcrumbJsonLd(items)} />
    </>
  );
}
