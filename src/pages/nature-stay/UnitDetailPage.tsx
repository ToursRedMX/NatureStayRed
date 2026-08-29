import { useParams, Link } from "react-router-dom";
import { Users, Bed, Bath, Maximize, CalendarDays, PawPrint, Home } from "lucide-react";
import { useProperty } from "@/hooks/nature-stay/useProperty";
import { useUnits } from "@/hooks/nature-stay/useUnits";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

export function UnitDetailPage() {
  const { slug, unitSlug } = useParams<{ slug: string; unitSlug: string }>();
  const { data: property, loading: propLoading, error: propError } = useProperty(slug);
  const { data: units, loading: unitsLoading } = useUnits(property?.id);

  if (propLoading) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  if (propError) {
    return <div className="mx-auto max-w-3xl px-4 py-12"><ErrorAlert message={propError} /></div>;
  }

  if (!property) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState icon={<Home size={48} />} title="Alojamiento no encontrado" />
      </div>
    );
  }

  const unit = units.find((u) => u.slug === unitSlug || u.id === unitSlug);

  if (unitsLoading) {
    return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;
  }

  if (!unit) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState icon={<Home size={48} />} title="Unidad no encontrada" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <nav className="text-sm text-sand-600">
        <Link to="/nature-stay" className="hover:text-forest-700">Explorar</Link>
        <span className="mx-2">/</span>
        <Link to={`/nature-stay/${property.slug}`} className="hover:text-forest-700">{property.name}</Link>
        <span className="mx-2">/</span>
        <span className="text-forest-700">{unit.name}</span>
      </nav>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div>
            <h1 className="font-display text-3xl font-bold text-forest-800">{unit.name}</h1>
            {unit.description && (
              <p className="mt-3 whitespace-pre-line text-forest-600">{unit.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat icon={<Users size={18} />} label="Huéspedes" value={`${unit.max_guests}`} />
            {unit.bedrooms != null && <Stat icon={<Bed size={18} />} label="Recámaras" value={`${unit.bedrooms}`} />}
            {unit.bathrooms != null && <Stat icon={<Bath size={18} />} label="Baños" value={`${unit.bathrooms}`} />}
            {unit.area_m2 != null && <Stat icon={<Maximize size={18} />} label="Área" value={`${unit.area_m2} m²`} />}
          </div>

          <div className="rounded-xl border border-sand-200 bg-white p-5">
            <h2 className="font-display text-lg font-semibold text-forest-800">Detalles</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailRow label="Huéspedes base" value={`${unit.base_guests}`} />
              <DetailRow label="Huéspedes máx." value={`${unit.max_guests}`} />
              {unit.max_adults != null && <DetailRow label="Adultos máx." value={`${unit.max_adults}`} />}
              {unit.max_children != null && <DetailRow label="Niños máx." value={`${unit.max_children}`} />}
              {unit.max_infants != null && <DetailRow label="Infantes máx." value={`${unit.max_infants}`} />}
              {unit.beds != null && <DetailRow label="Camas" value={`${unit.beds}`} />}
              <DetailRow label="Noches mín." value={`${unit.minimum_nights}`} />
              {unit.maximum_nights != null && <DetailRow label="Noches máx." value={`${unit.maximum_nights}`} />}
              <DetailRow label="Cantidad" value={`${unit.quantity}`} />
              <DetailRow label="Modo de precio" value={unit.pricing_mode === "per_unit_per_night" ? "Por unidad por noche" : "Por persona por noche"} />
            </div>
          </div>

          {unit.pets_allowed != null && (
            <div className="flex items-center gap-3 rounded-xl border border-sand-200 bg-white p-4">
              <PawPrint size={20} className="text-forest-600" />
              <span className="text-sm text-forest-700">
                {unit.pets_allowed ? "Se permiten mascotas" : "No se permiten mascotas"}
                {unit.pets_allowed && unit.max_pets != null && ` (máx. ${unit.max_pets})`}
                {unit.pet_fee != null && ` · Tarifa: ${formatPrice(unit.pet_fee, unit.currency)}`}
              </span>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-2xl border border-forest-200 bg-white p-5 shadow-sm">
            <p className="font-display text-2xl font-bold text-forest-700">
              {formatPrice(unit.base_price, unit.currency)}
            </p>
            <p className="text-sm text-sand-500">por noche</p>

            {unit.extra_guest_price != null && (
              <p className="mt-2 text-sm text-sand-600">
                Huésped extra: {formatPrice(unit.extra_guest_price, unit.currency)}
              </p>
            )}

            <div className="mt-4 flex items-center gap-2 text-sm text-sand-600">
              <CalendarDays size={16} />
              Mínimo {unit.minimum_nights} {unit.minimum_nights === 1 ? "noche" : "noches"}
            </div>

            <Button variant="outline" size="md" className="mt-4 w-full" disabled>
              Reservar próximamente
            </Button>
            <p className="mt-3 text-center text-xs text-sand-400">
              Disponible en una próxima fase
            </p>

            <Link to={`/nature-stay/${property.slug}`} className="mt-4 block text-center text-sm text-forest-600 hover:text-forest-700">
              Ver todas las unidades
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl border border-sand-200 bg-white p-4">
      <span className="text-forest-500">{icon}</span>
      <span className="font-semibold text-forest-800">{value}</span>
      <span className="text-xs text-sand-500">{label}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-sand-100 pb-2 text-sm">
      <span className="text-sand-600">{label}</span>
      <span className="font-medium text-forest-800">{value}</span>
    </div>
  );
}
