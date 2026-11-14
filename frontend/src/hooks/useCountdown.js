"use client";
import { useEffect, useState } from "react";

export default function useCountdown(iso) {
  const [left, setLeft] = useState(null);
  useEffect(() => {
    if (!iso) return;
    const end = new Date(iso).getTime();
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [iso]);

  if (left === null) return { text: "", expired: false };
  const s = Math.floor(left / 1000);
  return {
    text: `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`,
    expired: left === 0,
  };
}