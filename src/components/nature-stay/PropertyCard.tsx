import { Link } from "react-router-dom";
import { MapPin, PawPrint, Zap, Home } from "lucide-react";
import type { PropertyPublic, PropertyType } from "@/types/nature-stay";
import { getNatureStayPublicImageUrl } from "@/lib/nature-stay-images";
import { cn, formatPrice } from "@/lib/utils";

interface PropertyCardProps {
  property: PropertyPublic;
  propertyType?: PropertyType;
  coverImageStoragePath?: string | null;
  minPrice?: number | null;
  priceCurrency?: string | null;
  priceMode?: string | null;
}

export function PropertyCard({
  property,
  propertyType,
  coverImageStoragePath,
  minPrice,
  priceCurrency,
  priceMode,
}: PropertyCardProps) {
  const coverUrl = getNatureStayPublicImageUrl(coverImageStoragePath);

  return (
    <Link
      to={`/nature-stay/${property.slug}`}
      className="group block overflow-hidden rounded-2xl border border-sand-200 bg-white transition-all duration-300 hover:shadow-xl hover:border-forest-200 hover:-translate-y-1"
    >
      <div className="relative h-56 overflow-hidden bg-sand-100">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={property.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-forest-100 to-forest-200">
            <Home size={40} className="text-forest-300" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {property.instant_booking_enabled && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-forest-700 backdrop-blur-sm">
              <Zap size={12} />
              Reserva inmediata
            </span>
          )}
          {property.pets_allowed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-forest-700 backdrop-blur-sm">
              <PawPrint size={12} />
              Pet friendly
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display text-lg font-semibold text-forest-800 line-clamp-1">
            {property.name}
          </h3>
          {propertyType && (
            <span className="flex-shrink-0 rounded-full bg-forest-50 px-2.5 py-0.5 text-xs font-medium text-forest-600">
              {propertyType.name}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-sm text-sand-600">
          <MapPin size={14} className="text-terracotta-500" />
          <span className="line-clamp-1">
            {[property.city, property.state].filter(Boolean).join(", ")}
          </span>
        </div>

        {property.short_description && (
          <p className="text-sm text-forest-600 line-clamp-2">{property.short_description}</p>
        )}

        {minPrice != null && priceCurrency && (
          <div className="pt-1">
            <span className="font-display text-lg font-bold text-forest-700">
              Desde {formatPrice(minPrice, priceCurrency)}
            </span>
            {priceMode === "per_unit_per_night" && (
              <span className="ml-1 text-xs text-sand-500">/ noche</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
