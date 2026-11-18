"use client";

import ResourceManager from "@/components/admin/ResourceManager";
import cfg from "@/components/admin/resources/coupons";

export default function Page() {
  return <ResourceManager cfg={cfg} />;
}
