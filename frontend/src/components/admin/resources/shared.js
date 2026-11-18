export const nn = (s) => { const t = String(s ?? "").trim(); return t || null; };
export const numOrNull = (s) => (String(s ?? "").trim() === "" ? null : Number(s));
export const STATUS3 = [["draft", "Draft"], ["published", "Published"], ["archived", "Archived"]];
