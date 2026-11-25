"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BANGLADESH_CENTER, BANGLADESH_REGIONS } from "./data";

function buildPinIcon(isActive, label) {
  return L.divIcon({
    className: "bb-map-pin",
    iconSize: [140, 44],
    iconAnchor: [16, 16],
    html: `
      <div style="display:flex;align-items:center;gap:8px;cursor:pointer;transform:translateZ(0);">
        <span style="position:relative;display:grid;place-items:center;width:30px;height:30px;">
          ${
            isActive
              ? '<span style="position:absolute;inset:-4px;border-radius:9999px;background:rgba(232,169,60,0.45);animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></span>'
              : ""
          }
          <span style="position:relative;display:grid;place-items:center;width:${isActive ? 24 : 18}px;height:${isActive ? 24 : 18}px;border-radius:9999px;background:${isActive ? "#E8A93C" : "#123D32"};border:2.5px solid #ffffff;box-shadow:0 4px 14px rgba(0,0,0,0.45);transition:all .25s ease;">
            <span style="width:6px;height:6px;border-radius:9999px;background:${isActive ? "#082B21" : "#E8A93C"};"></span>
          </span>
        </span>
        <span style="white-space:nowrap;padding:4px 10px;border-radius:9999px;font-size:11px;font-weight:700;letter-spacing:0.02em;background:${isActive ? "#E8A93C" : "rgba(8,43,33,0.9)"};color:${isActive ? "#082B21" : "#ffffff"};border:1px solid ${isActive ? "#ffffff" : "rgba(232,169,60,0.4)"};box-shadow:0 4px 12px rgba(0,0,0,0.35);">
          ${label}
        </span>
      </div>
    `,
  });
}

export default function BangladeshRealMapCanvas({ selectedId, onSelect }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: BANGLADESH_CENTER,
      zoom: 7,
      minZoom: 6,
      maxZoom: 13,
      scrollWheelZoom: false,
      zoomControl: false,
    });

    L.control.zoom({ position: "topright" }).addTo(map);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    const routeCoords = [
      [23.71, 90.407],
      [22.02, 89.52],
      [21.427, 92.005],
      [23.382, 92.294],
      [24.55, 91.82],
      [24.75, 88.95],
    ];
    L.polyline(routeCoords, {
      color: "#123D32",
      weight: 2.5,
      opacity: 0.55,
      dashArray: "6 8",
    }).addTo(map);

    BANGLADESH_REGIONS.forEach((region) => {
      const marker = L.marker([region.lat, region.lng], {
        icon: buildPinIcon(region.id === selectedId, region.shortName),
        title: region.name,
      })
        .addTo(map)
        .on("click", () => {
          onSelectRef.current?.(region.id);
        });
      markersRef.current[region.id] = marker;
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    BANGLADESH_REGIONS.forEach((region) => {
      const marker = markersRef.current[region.id];
      if (!marker) return;
      const isActive = region.id === selectedId;
      marker.setIcon(buildPinIcon(isActive, region.shortName));
      marker.setZIndexOffset(isActive ? 1000 : 100);
    });

    const target = BANGLADESH_REGIONS.find((r) => r.id === selectedId);
    if (target) {
      map.flyTo([target.lat, target.lng], target.zoom || 8, {
        duration: 1.1,
        easeLinearity: 0.25,
      });
    }
  }, [selectedId]);

  const resetOverview = () => {
    mapRef.current?.flyTo(BANGLADESH_CENTER, 7, { duration: 0.9 });
  };

  return (
    <div className="relative h-[20rem] w-full overflow-hidden rounded-2xl border border-white/15 sm:h-[25rem] lg:h-[30rem]">
      <div ref={containerRef} className="z-0 h-full w-full" />
      <button
        type="button"
        onClick={resetOverview}
        className="absolute bottom-3 left-3 z-[400] rounded-full bg-primary-dark/90 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-primary-dark"
      >
        ⌖ Full Bangladesh View
      </button>
    </div>
  );
}