import { useParams, Link } from "react-router-dom";
import {
  MapPin, Clock, PawPrint, Zap, Baby, Cigarette, Music,
  Accessibility, Home as HomeIcon, Users, Bed, Bath, Maximize,
  CalendarDays, Home, CheckCircle2
} from "lucide-react";
import { useProperty } from "@/hooks/nature-stay/useProperty";
import { useUnits } from "@/hooks/nature-stay/useUnits";
import { useHostInfo } from "@/hooks/nature-stay/useHostInfo";
import { usePropertyAmenities } from "@/hooks/nature-stay/usePropertyAmenities";
import { usePropertyImages } from "@/hooks/nature-stay/usePropertyImages";
import { usePropertyTypes } from "@/hooks/nature-stay/useCatalogs";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";
import type { UnitPublic } from "@/types/nature-stay";

export function PropertyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: property, loading, error } = useProperty(slug);
  const { data: units, loading: unitsLoading } = useUnits(property?.id);
  const { data: host, loading: hostLoading } = useHostInfo(property?.host_id);
  const { data: amenities, loading: amenitiesLoading } = usePropertyAmenities(property?.id);
  const { data: images, loading: imagesLoading } = usePropertyImages(property?.id);
  const { data: propertyTypes } = usePropertyTypes();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorAlert message={error} />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <EmptyState
          icon={<Home size={48} />}
          title="Alojamiento no encontrado"
          description="Es posible que este alojamiento ya no esté disponible."
        />
      </div>
    );
  }

  const propertyType = propertyTypes.find((t) => t.id === property.property_type_id);
  const coverImage = images.find((img) => img.is_cover) || images[0];
  const galleryImages = images.filter((img) => !img.is_cover).slice(0, 4);
  const amenityCategories = [...new Set(amenities.map((a) => a.category))];

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <nav className="text-sm text-sand-600">
          <Link to="/nature-stay" className="hover:text-forest-700">Explorar</Link>
          <span className="mx-2">/</span>
          <span className="text-forest-700">{property.name}</span>
        </nav>
      </div>

      {/* Gallery */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-3 overflow-hidden rounded-2xl md:grid-cols-2 md:rounded-3xl">
          <div className="h-72 md:h-96">
            {coverImage ? (
              <img src={coverImage.storage_path} alt={coverImage.alt_text || property.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-forest-100 to-forest-200">
                <HomeIcon size={48} className="text-forest-300" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {galleryImages.slice(0, 4).map((img) => (
              <div key={img.id} className="h-36 md:h-48">
                <img src={img.storage_path} alt={img.alt_text || ""} className="h-full w-full object-cover rounded-lg md:rounded-xl" />
              </div>
            ))}
            {galleryImages.length === 0 && !imagesLoading && (
              <>
                <div className="flex h-36 items-center justify-center bg-sand-100 rounded-lg md:h-48 md:rounded-xl">
                  <HomeIcon size={32} className="text-sand-300" />
                </div>
                <div className="flex h-36 items-center justify-center bg-sand-100 rounded-lg md:h-48 md:rounded-xl">
                  <HomeIcon size={32} className="text-sand-300" />
                </div>
                <div className="flex h-36 items-center justify-center bg-sand-100 rounded-lg md:h-48 md:rounded-xl">
                  <HomeIcon size={32} className="text-sand-300" />
                </div>
                <div className="flex h-36 items-center justify-center bg-sand-100 rounded-lg md:h-48 md:rounded-xl">
                  <HomeIcon size={32} className="text-sand-300" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main */}
          <div className="space-y-8 lg:col-span-2">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {propertyType && <Badge variant="success">{propertyType.name}</Badge>}
                {property.instant_booking_enabled && (
                  <Badge variant="info"><Zap size={12} /> Reserva inmediata</Badge>
                )}
                {property.pets_allowed && (
                  <Badge><PawPrint size={12} /> Pet friendly</Badge>
                )}
              </div>
              <h1 className="mt-3 font-display text-3xl font-bold text-forest-800">
                {property.name}
              </h1>
              <div className="mt-2 flex items-center gap-1 text-sand-600">
                <MapPin size={16} className="text-terracotta-500" />
                <span>
                  {[property.municipality, property.city, property.state].filter(Boolean).join(", ")}
                </span>
              </div>
            </div>

            {/* Description */}
            {property.description && (
              <div className="prose max-w-none">
                <h2 className="font-display text-xl font-semibold text-forest-800">Descripción</h2>
                <p className="mt-2 whitespace-pre-line text-forest-600">{property.description}</p>
              </div>
            )}

            {/* Amenities */}
            {!amenitiesLoading && amenities.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-forest-800">Servicios</h2>
                <div className="mt-4 space-y-4">
                  {amenityCategories.map((cat) => (
                    <div key={cat}>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-sand-600">
                        {cat}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {amenities.filter((a) => a.category === cat).map((a) => (
                          <Badge key={a.id} variant="success">
                            <CheckCircle2 size={12} />
                            {a.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules */}
            <div>
              <h2 className="font-display text-xl font-semibold text-forest-800">Reglas</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <RuleRow icon={<Clock size={16} />} label="Check-in" value={property.check_in_time || "No especificado"} />
                <RuleRow icon={<Clock size={16} />} label="Check-out" value={property.check_out_time || "No especificado"} />
                <RuleRow icon={<PawPrint size={16} />} label="Mascotas" value={property.pets_allowed === true ? "Permitidas" : property.pets_allowed === false ? "No permitidas" : "No especificado"} />
                <RuleRow icon={<Baby size={16} />} label="Niños" value={property.children_allowed === true ? "Permitidos" : property.children_allowed === false ? "No permitidos" : "No especificado"} />
                <RuleRow icon={<Cigarette size={16} />} label="Fumar" value={property.smoking_allowed === true ? "Permitido" : property.smoking_allowed === false ? "No permitido" : "No especificado"} />
                <RuleRow icon={<Music size={16} />} label="Fiestas" value={property.parties_allowed === true ? "Permitidas" : property.parties_allowed === false ? "No permitidas" : "No especificado"} />
              </div>
              {property.house_rules && (
                <div className="mt-4 rounded-xl border border-sand-200 bg-sand-50 p-4">
                  <p className="whitespace-pre-line text-sm text-forest-700">{property.house_rules}</p>
                </div>
              )}
              {property.accessibility_info && (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <Accessibility size={18} className="mt-0.5 flex-shrink-0 text-blue-600" />
                  <p className="text-sm text-blue-800">{property.accessibility_info}</p>
                </div>
              )}
            </div>

            {/* Units */}
            <div>
              <h2 className="font-display text-xl font-semibold text-forest-800">
                Unidades disponibles
              </h2>
              {unitsLoading ? (
                <div className="flex justify-center py-8"><Spinner /></div>
              ) : units.length === 0 ? (
                <p className="mt-3 text-sand-600">No hay unidades publicadas todavía.</p>
              ) : (
                <div className="mt-4 space-y-4">
                  {units.map((unit) => (
                    <UnitCard key={unit.id} unit={unit} propertySlug={property.slug} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Host */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {!hostLoading && host && (
                <div className="rounded-2xl border border-sand-200 bg-white p-5">
                  <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-sand-600">
                    Anfitrión
                  </h3>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-100 text-forest-700 font-semibold">
                      {host.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-forest-800">{host.display_name}</p>
                      {host.city && <p className="text-sm text-sand-600">{host.city}</p>}
                    </div>
                  </div>
                  {host.description && (
                    <p className="mt-3 text-sm text-forest-600 line-clamp-3">{host.description}</p>
                  )}
                </div>
              )}

              {/* Booking placeholder */}
              <div className="rounded-2xl border border-forest-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-sand-600">Próximamente</p>
                <p className="mt-1 font-display text-lg font-semibold text-forest-800">
                  Sistema de reservas
                </p>
                <p className="mt-2 text-sm text-forest-600">
                  Estamos trabajando para que pronto puedas reservar tu estancia directamente.
                </p>
                <Button variant="outline" size="md" className="mt-4 w-full" disabled>
                  Seleccionar fechas
                </Button>
                <p className="mt-3 text-center text-xs text-sand-400">
                  Disponible en una próxima fase
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RuleRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-sand-200 bg-white px-4 py-2.5">
      <span className="text-forest-500">{icon}</span>
      <div>
        <p className="text-xs text-sand-500">{label}</p>
        <p className="text-sm font-medium text-forest-800">{value}</p>
      </div>
    </div>
  );
}

function UnitCard({ unit, propertySlug }: { unit: UnitPublic; propertySlug: string }) {
  const detailLink = `/nature-stay/${propertySlug}/unit/${unit.slug || unit.id}`;
  return (
    <Link
      to={detailLink}
      className="block rounded-2xl border border-sand-200 bg-white p-5 transition-all hover:border-forest-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-forest-800">{unit.name}</h3>
          {unit.description && (
            <p className="mt-1 text-sm text-forest-600 line-clamp-2">{unit.description}</p>
          )}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-display text-xl font-bold text-forest-700">
            {formatPrice(unit.base_price, unit.currency)}
          </p>
          <p className="text-xs text-sand-500">por noche</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-sand-600">
        <span className="flex items-center gap-1.5"><Users size={14} /> {unit.max_guests} huéspedes</span>
        {unit.bedrooms != null && <span className="flex items-center gap-1.5"><Bed size={14} /> {unit.bedrooms} recámaras</span>}
        {unit.bathrooms != null && <span className="flex items-center gap-1.5"><Bath size={14} /> {unit.bathrooms} baños</span>}
        {unit.area_m2 != null && <span className="flex items-center gap-1.5"><Maximize size={14} /> {unit.area_m2} m²</span>}
        <span className="flex items-center gap-1.5"><CalendarDays size={14} /> Mín. {unit.minimum_nights} noches</span>
      </div>
    </Link>
  );
}
