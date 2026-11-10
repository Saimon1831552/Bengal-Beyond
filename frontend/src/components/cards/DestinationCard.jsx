import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";

export default function DestinationCard({ destination }) {
  return (
    <Card className="flex h-full flex-col">
      {destination.image ? (
        <div className="relative h-40">
          <Image
            src={destination.image}
            alt=""
            fill
            sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-40 bg-gradient-to-br from-accent via-primary to-primary-dark" aria-hidden="true" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">{destination.region}</p>
        <h2 className="mt-2 text-xl">
          <Link href={`/destinations/${destination.slug}`} className="!text-primary after:absolute after:inset-0">
            {destination.name}
          </Link>
        </h2>
        <p className="mt-2 line-clamp-3 text-sm text-muted">{destination.summary}</p>
      </div>
    </Card>
  );
}