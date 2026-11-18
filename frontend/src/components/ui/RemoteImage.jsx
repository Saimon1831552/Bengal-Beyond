/* eslint-disable @next/next/no-img-element */
// Same props as next/image's `fill` usage, but never throws for unknown hosts.
export default function RemoteImage({ src, alt = "", className = "", fill, sizes, priority, ...rest }) {
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      sizes={sizes}
      className={`${fill ? "absolute inset-0 h-full w-full" : ""} ${className}`}
      {...rest}
    />
  );
}
