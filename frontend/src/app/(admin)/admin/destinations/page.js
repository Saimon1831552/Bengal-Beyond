"use client";

import ResourceManager from "@/components/admin/ResourceManager";
import cfg from "@/components/admin/resources/destinations";

export default function Page() {
  return <ResourceManager cfg={cfg} />;
}
