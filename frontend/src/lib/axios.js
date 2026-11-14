import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";
import { hasSessionHint, setSessionHint, clearSessionHint } from "./session";

const baseURL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");

const api = axios.create({
  baseURL: `${baseURL}/`,
  withCredentials: true, // sends the httpOnly refresh cookie
  headers: { "Content-Type": "application/json" },
});

const unwrap = (res) => res.data?.data ?? res.data;
const isAuthEndpoint = (url = "") => /\/auth\/(?:login|register|refresh|logout)(?:[/?]|$)/i.test(url);

/* ---- single-flight refresh (shared by AuthProvider and the 401 interceptor) ---- */
let inflight = null;

async function doRefresh() {
  try {
    const session = unwrap(await api.post("/auth/refresh"));
    if (!session?.accessToken) throw new Error("No access token in refresh response.");
    useAuthStore.getState().setAuth(session.user || null, session.accessToken);
    setSessionHint();
    return session;
  } catch (err) {
    const status = err.response?.status;
    if (status === 401 || status === 403) {
      clearSessionHint();
      useAuthStore.getState().clearAuth();
    }
    throw err; // network/5xx errors keep the hint so a later attempt can succeed
  }
}

export function refreshSession() {
  if (!inflight) {
    // navigator.locks serialises refreshes across browser tabs
    const run = typeof navigator !== "undefined" && navigator.locks
      ? navigator.locks.request("bb-refresh", doRefresh)
      : doRefresh();
    inflight = run.finally(() => { inflight = null; });
  }
  return inflight;
}

/* ---- interceptors ---- */
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config;
    if (
      error.response?.status !== 401 ||
      !config ||
      config._retry ||
      isAuthEndpoint(config.url) ||
      !hasSessionHint() // guests must not trigger refresh calls
    ) {
      return Promise.reject(error);
    }
    config._retry = true;
    try {
      const session = await refreshSession();
      config.headers.set("Authorization", `Bearer ${session.accessToken}`);
      return api(config);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default api;