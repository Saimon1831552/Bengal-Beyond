"use client";

import dynamic from "next/dynamic";

const Hero3D = dynamic(() => import("./Hero3D"), {
  ssr: false,
  loading: () => <div className="h-[360px] w-full" />,
});

export default function Hero3DLoader() {
  return <Hero3D />;
}
