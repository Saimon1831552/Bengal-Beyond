"use client";

import ResourceManager from "@/components/admin/ResourceManager";
import cfg from "@/components/admin/resources/gallery";

export default function Page() {
  return <ResourceManager cfg={cfg} />;
}
