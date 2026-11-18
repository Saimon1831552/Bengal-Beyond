import api from "./axios";
import { useAccessStore } from "../store/useAccessStore";

export const kindOf = (roles = [], perms = []) =>
  roles.includes("super_admin") ? "super_admin"
  : perms.length || roles.some((r) => r !== "customer") ? "staff"
  : "customer";

export const homeFor = (a) => (kindOf(a.roles, a.permissions) === "customer" ? "/dashboard" : "/admin");

export async function loadAccess() {
  const s = useAccessStore.getState();
  s.setLoading();
  try {
    const d = (await api.get("/me/permissions")).data.data;
    s.setAccess(d.roles || [], d.permissions || []);
    return { roles: d.roles || [], permissions: d.permissions || [] };
  } catch {
    s.setError();
    return { roles: [], permissions: [] };
  }
}

/** Shared by the site chrome and the cursor: these paths use the dashboard shell */
export const isAppRoute = (p = "") => /^\/(admin|dashboard|bookings|payments|wishlist)(\/|$)/.test(p);