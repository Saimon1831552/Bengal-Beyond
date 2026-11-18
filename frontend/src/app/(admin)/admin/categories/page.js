"use client";

import ResourceManager from "@/components/admin/ResourceManager";
import { categories as cfg } from "@/components/admin/resources/taxonomy";

export default function Page() {
  return <ResourceManager cfg={cfg} />;
}
