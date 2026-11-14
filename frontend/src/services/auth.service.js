import api, { refreshSession } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { setSessionHint, clearSessionHint } from "../lib/session";

const unwrap = (res) => res.data?.data ?? res.data;

function saveSession(session) {
  if (!session?.accessToken) throw new Error("Authentication response did not include an access token.");
  useAuthStore.getState().setAuth(session.user || null, session.accessToken);
  setSessionHint();
  return session;
}

export const authService = {
  login: async (email, password) => saveSession(unwrap(await api.post("/auth/login", { email, password }))),
  register: async (data) => saveSession(unwrap(await api.post("/auth/register", data))),
  refreshSession,
  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearSessionHint();
      useAuthStore.getState().clearAuth();
    }
  },
};