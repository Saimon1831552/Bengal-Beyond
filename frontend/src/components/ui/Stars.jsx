export default function Stars({ value, className = "" }) {
  const n = Math.round(value);
  return <span className={`text-gold ${className}`} role="img" aria-label={`${value} out of 5 stars`}>{"★".repeat(n)}<span className="text-border">{"★".repeat(5 - n)}</span></span>;
}
