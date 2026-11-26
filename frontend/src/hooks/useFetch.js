"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";

export default function useFetch(path) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ data: null, meta: null, raw: null, error: null, loading: !!path });

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!path) return;
    let active = true;
    api
      .get(path)
      .then((res) => {
        if (active) {
          setState({ data: res.data?.data ?? null, meta: res.data?.meta ?? null, raw: res.data, error: null, loading: false });
        }
      })
      .catch((error) => {
        if (active) {
          setState({ data: null, meta: null, raw: null, error, loading: false });
        }
      });
    return () => {
      active = false;
    };
  }, [path, tick]);

  return { ...state, reload };
}