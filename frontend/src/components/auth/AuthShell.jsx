import Container from "@/components/ui/Container";

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <Container as="main" className="py-12">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-white p-8 shadow-sm">
        <h1 className="text-3xl text-primary">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <p className="mt-6 text-center text-sm text-muted">{footer}</p>}
    </Container>
  );
}