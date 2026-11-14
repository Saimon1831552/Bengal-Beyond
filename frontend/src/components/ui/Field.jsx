export const inputCls =
  "mt-1 w-full rounded-xl border border-border bg-white px-4 py-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20";

export default function Field({ label, as: Tag = "input", hint, ...props }) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <Tag className={inputCls} {...props} />
      {hint && <span className="mt-1 block text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}