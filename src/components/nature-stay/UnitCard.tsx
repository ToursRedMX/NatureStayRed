import { Link } from "react-router-dom";
import { Users, Bed, Bath, Maximize, CalendarDays, PawPrint, Package } from "lucide-react";
import type { UnitPublic, UnitType } from "@/types/nature-stay";
import { formatPrice } from "@/lib/utils";

interface UnitCardProps {
  unit: UnitPublic;
  propertySlug: string;
  unitType?: UnitType;
}

export function UnitCard({ unit, propertySlug, unitType }: UnitCardProps) {
  const detailLink = `/nature-stay/${propertySlug}/unit/${unit.slug || unit.id}`;
  const pricingLabel =
    unit.pricing_mode === "per_unit_per_night" ? "por noche" : "por persona / noche";

  return (
    <Link
      to={detailLink}
      className="block rounded-2xl border border-sand-200 bg-white p-5 transition-all hover:border-forest-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold text-forest-800">{unit.name}</h3>
          {unitType && (
            <span className="mt-0.5 inline-block text-xs font-medium text-sand-600">
              {unitType.name}
            </span>
          )}
          {unit.description && (
            <p className="mt-1 text-sm text-forest-600 line-clamp-2">{unit.description}</p>
          )}
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="font-display text-xl font-bold text-forest-700">
            {formatPrice(unit.base_price, unit.currency)}
          </p>
          <p className="text-xs text-sand-500">{pricingLabel}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-sand-600">
        <span className="flex items-center gap-1.5">
          <Users size={14} /> {unit.max_guests} huéspedes
        </span>
        {unit.bedrooms != null && (
          <span className="flex items-center gap-1.5">
            <Bed size={14} /> {unit.bedrooms} recámaras
          </span>
        )}
        {unit.bathrooms != null && (
          <span className="flex items-center gap-1.5">
            <Bath size={14} /> {unit.bathrooms} baños
          </span>
        )}
        {unit.area_m2 != null && (
          <span className="flex items-center gap-1.5">
            <Maximize size={14} /> {unit.area_m2} m²
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <CalendarDays size={14} /> Mín. {unit.minimum_nights}{" "}
          {unit.minimum_nights === 1 ? "noche" : "noches"}
        </span>
        {unit.quantity > 1 && (
          <span className="flex items-center gap-1.5">
            <Package size={14} /> {unit.quantity} unidades
          </span>
        )}
        {unit.pets_allowed && (
          <span className="flex items-center gap-1.5 text-forest-600">
            <PawPrint size={14} /> Pet friendly
          </span>
        )}
      </div>
    </Link>
  );
}
