import { create } from "zustand";

// Memory only. Nothing here is ever written to localStorage.
// status: "loading" (before first check) | "authenticated" | "guest"
export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  status: "loading",
  setAuth: (user, token) => set({ user, token, status: "authenticated" }),
  clearAuth: () => set({ user: null, token: null, status: "guest" }),
}));