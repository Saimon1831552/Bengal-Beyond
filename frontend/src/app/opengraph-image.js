import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Default share card for every page that doesn't define its own image
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "linear-gradient(135deg,#0B2A22,#123D32 55%,#16856A)", color: "#F8F7F2" }}>
        <div style={{ fontSize: 28, letterSpacing: 6, textTransform: "uppercase", color: "#D6A85F" }}>Bangladesh</div>
        <div style={{ fontSize: 96, lineHeight: 1.05, marginTop: 24 }}>Discover Bangladesh.</div>
        <div style={{ fontSize: 96, lineHeight: 1.05, color: "#D6A85F" }}>Beyond the Ordinary.</div>
        <div style={{ fontSize: 36, marginTop: 40, color: "#E8D8B9" }}>{siteConfig.name}</div>
      </div>
    ),
    size
  );
}
