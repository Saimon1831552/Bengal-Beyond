import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import { formatPrice } from "@/lib/format";

export default function TourCard({ tour }) {
  const price = formatPrice(tour.price, tour.currency);
  return (
    <Card className="flex h-full flex-col">
      {tour.image ? (
        <div className="relative h-44">
          <Image
            src={tour.image}
            alt=""
            fill
            sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="h-44 bg-gradient-to-br from-primary-dark via-primary to-accent" aria-hidden="true" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold">{tour.category}</p>
        <h2 className="mt-2 text-xl">
          <Link href={`/tours/${tour.slug}`} className="!text-primary after:absolute after:inset-0">
            {tour.title}
          </Link>
        </h2>
        <p className="mt-2 flex-1 text-sm text-muted">{tour.summary}</p>
        <div className="mt-4 flex items-center justify-between text-sm font-semibold text-primary">
          <span>{tour.days} {tour.days === 1 ? "day" : "days"}</span>
          {price && <span>From {price}</span>}
        </div>
      </div>
    </Card>
  );
}