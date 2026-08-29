import { useParams, Link } from "react-router-dom";
import { useEffect } from "react";
import {
  MapPin, Clock, PawPrint, Zap, Baby, Cigarette, Music,
  Accessibility, Home, CheckCircle2, Compass
} from "lucide-react";
import { useProperty } from "@/hooks/nature-stay/useProperty";
import { useUnits } from "@/hooks/nature-stay/useUnits";
import { useHostInfo } from "@/hooks/nature-stay/useHostInfo";
import { usePropertyAmenities } from "@/hooks/nature-stay/usePropertyAmenities";
import { usePropertyImages } from "@/hooks/nature-stay/usePropertyImages";
import { usePropertyTypes, useUnitTypes } from "@/hooks/nature-stay/useCatalogs";
import { usePropertyTourLinks } from "@/hooks/nature-stay/usePropertyTourLinks";
import { PropertyGallery } from "@/components/nature-stay/PropertyGallery";
import { UnitCard } from "@/components/nature-stay/UnitCard";
import { HostPublicCard } from "@/components/nature-stay/HostPublicCard";
import { TourCrossSellCard } from "@/components/nature-stay/TourCrossSellCard";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { setDocumentMeta } from "@/lib/seo";

export function PropertyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: property, loading, error } = useProperty(slug);
  const { data: units, loading: unitsLoading } = useUnits(property?.id);
  const { data: host, loading: hostLoading } = useHostInfo(property?.host_id);
  const { data: amenities, loading: amenitiesLoading } = usePropertyAmenities(property?.id);
  const { data: images, loading: imagesLoading } = usePropertyImages(property?.id);
  const { data: propertyTypes } = usePropertyTypes();
  const { data: unitTypes } = useUnitTypes();
  const { links, tours, loading: toursLoading } = usePropertyTourLinks(property?.id);

  useEffect(() => {
    if (property) {
      const location = [property.city, property.state].filter(Boolean).join(", ");
      setDocumentMeta(
        `${property.name} | Nature Stay Red`,
        property.short_description || `Alojamiento en ${location} rodeado de naturaleza.`
      );
    } else {
      setDocumentMeta("Alojamiento | Nature Stay Red");
    }
  }, [property]);

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
          description="Es posible que este alojamiento ya no esté disponible o el enlace no sea correcto."
          action={
            <Link to="/nature-stay">
              <Button variant="secondary">Volver al inicio</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const propertyType = propertyTypes.find((t) => t.id === property.property_type_id);
  const amenityCategories = [...new Set(amenities.map((a) => a.category))];

  // Match tours to links for display
  const tourLinksWithTours = links
    .map((link) => ({
      link,
      tour: tours.find((t) => t.id === link.tour_id),
    }))
    .filter((item) => item.tour)
    .sort((a, b) => a.link.display_order - b.link.display_order);

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
        <PropertyGallery
          images={images}
          altName={property.name}
          loading={imagesLoading}
        />
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

            {/* Short description */}
            {property.short_description && (
              <p className="text-lg text-forest-600">{property.short_description}</p>
            )}

            {/* Full description */}
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

            {/* House rules */}
            <div>
              <h2 className="font-display text-xl font-semibold text-forest-800">Reglas de la casa</h2>
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
                    <UnitCard
                      key={unit.id}
                      unit={unit}
                      propertySlug={property.slug}
                      unitType={unitTypes.find((t) => t.id === unit.unit_type_id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Tour cross-sell */}
            {!toursLoading && tourLinksWithTours.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-semibold text-forest-800">
                  Tours y experiencias cerca
                </h2>
                <p className="mt-1 text-sm text-sand-600">
                  Descubre aventuras y experiencias en la zona, cortesía de ToursRed.
                </p>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {tourLinksWithTours.map(({ tour, link }) => (
                    tour && <TourCrossSellCard key={tour.id} tour={tour} link={link} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {host && <HostPublicCard host={host} loading={hostLoading} />}

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
