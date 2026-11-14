"use client";
import { useCallback, useEffect, useState } from "react";
import api from "@/lib/axios";

export default function useFetch(path) {
  const [state, setState] = useState({ data: null, meta: null, error: null, loading: true });

  const load = useCallback(async () => {
    try {
      const res = await api.get(path);
      setState({ data: res.data?.data ?? null, meta: res.data?.meta ?? null, error: null, loading: false });
    } catch (error) {
      setState({ data: null, meta: null, error, loading: false });
    }
  }, [path]);

  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}