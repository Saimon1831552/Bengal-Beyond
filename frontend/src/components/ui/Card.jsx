export default function Card({ className = "", children }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {children}
    </div>
  );
}