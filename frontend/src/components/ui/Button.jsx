import Link from "next/link";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  primary: "bg-primary text-white hover:bg-primary-dark",
  gold: "bg-gold text-primary-dark hover:brightness-95",
  outline: "border border-primary text-primary hover:bg-primary hover:text-white",
  ghost: "text-primary hover:bg-primary/10",
};

/** Renders a <Link> when `href` is given, otherwise a <button>. */
export default function Button({ href, variant = "primary", className = "", children, ...props }) {
  const classes = `${base} ${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}