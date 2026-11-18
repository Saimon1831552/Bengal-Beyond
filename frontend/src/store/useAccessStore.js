import { create } from "zustand";

// status: idle | loading | ready | error. Memory only, rebuilt from /me/permissions after every login or reload.
export const useAccessStore = create((set) => ({
  roles: [],
  permissions: [],
  status: "idle",
  setLoading: () => set({ status: "loading" }),
  setAccess: (roles, permissions) => set({ roles, permissions, status: "ready" }),
  setError: () => set({ status: "error" }),
  reset: () => set({ roles: [], permissions: [], status: "idle" }),
}));