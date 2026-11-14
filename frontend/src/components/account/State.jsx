import { errMsg } from "@/lib/errors";

export function Loading() { return <p role="status" className="py-10 text-muted">Loading…</p>; }
export function ErrorBox({ error, onRetry }) {
  return (
    <div role="alert" className="rounded-2xl border border-terracotta/30 bg-terracotta/10 p-5 text-sm text-terracotta">
      {errMsg(error)} {onRetry && <button onClick={onRetry} className="ml-2 font-semibold underline">Retry</button>}
    </div>
  );
}
export function Empty({ children }) { return <p className="rounded-2xl border border-dashed border-border bg-white p-8 text-center text-muted">{children}</p>; }