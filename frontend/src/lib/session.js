const KEY = "bb_session";

export const hasSessionHint = () => {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
};
export const setSessionHint = () => {
  try { localStorage.setItem(KEY, "1"); } catch {}
};
export const clearSessionHint = () => {
  try { localStorage.removeItem(KEY); } catch {}
};
export const SESSION_KEY = KEY;