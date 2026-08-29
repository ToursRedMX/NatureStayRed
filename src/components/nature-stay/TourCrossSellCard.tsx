import { Link } from "react-router-dom";
import { MapPin, Tag, ArrowRight } from "lucide-react";
import type { TourPublic, PropertyTourLinkPublic } from "@/types/nature-stay";
import { formatPrice } from "@/lib/utils";

interface TourCrossSellCardProps {
  tour: TourPublic;
  link?: PropertyTourLinkPublic;
}

export function TourCrossSellCard({ tour, link }: TourCrossSellCardProps) {
  const hasDiscount = link?.discount_type && link.discount_value != null;

  let discountLabel: string | null = null;
  if (hasDiscount) {
    if (link!.discount_type === "percentage") {
      discountLabel = `${link!.discount_value}% de descuento`;
    } else if (link!.discount_type === "fixed") {
      discountLabel = `Ahorra ${formatPrice(Number(link!.discount_value), "MXN")}`;
    }
  }

  return (
    <Link
      to={`/tours/${tour.slug}`}
      className="group block overflow-hidden rounded-2xl border border-sand-200 bg-white transition-all duration-300 hover:shadow-lg hover:border-forest-200"
    >
      <div className="relative h-40 overflow-hidden bg-sand-100">
        {tour.image_url ? (
          <img
            src={tour.image_url}
            alt={tour.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-terracotta-100 to-terracotta-200">
            <MapPin size={32} className="text-terracotta-400" />
          </div>
        )}
        {hasDiscount && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-terracotta-500 px-2.5 py-1 text-xs font-medium text-white shadow-sm">
            <Tag size={12} />
            {discountLabel}
          </span>
        )}
      </div>

      <div className="space-y-2 p-4">
        <h3 className="font-display text-base font-semibold text-forest-800 line-clamp-1">
          {tour.name}
        </h3>
        {tour.destination && (
          <p className="flex items-center gap-1 text-sm text-sand-600">
            <MapPin size={14} className="text-terracotta-500" />
            {tour.destination}
          </p>
        )}
        {tour.description && (
          <p className="text-sm text-forest-600 line-clamp-2">{tour.description}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          {tour.price != null ? (
            <span className="font-display text-lg font-bold text-forest-700">
              {formatPrice(tour.price, "MXN")}
            </span>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1 text-sm font-medium text-forest-600 transition-colors group-hover:text-forest-700">
            Ver tour
            <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </Link>
  );
}
