import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, MapPin, Users, Home as HomeIcon,
  Mountain, TreePine, Tent, Building2, Waves, Sparkles, Compass
} from "lucide-react";
import { useProperties } from "@/hooks/nature-stay/useProperties";
import { usePropertyTypes } from "@/hooks/nature-stay/useCatalogs";
import { PropertyCard } from "@/components/nature-stay/PropertyCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Button } from "@/components/ui/Button";

const HERO_IMAGE = "https://images.pexels.com/photos/29277697/pexels-photo-29277697.jpeg?auto=compress&cs=tinysrgb&w=1920";

const CATEGORY_ICONS: Record<string, typeof Mountain> = {
  cabin: Mountain,
  glamping: Tent,
  treehouse: TreePine,
  lodge: Building2,
  ranch: Compass,
  ecocabin: Sparkles,
  beachfront: Waves,
  default: HomeIcon,
};

export function MarketplacePage() {
  const { data: properties, loading, error } = useProperties();
  const { data: propertyTypes, loading: typesLoading } = usePropertyTypes();
  const [searchDestination, setSearchDestination] = useState("");
  const [searchGuests, setSearchGuests] = useState("");

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative flex min-h-[600px] items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt="Cabaña en el bosque al amanecer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-950/60 via-forest-950/40 to-forest-950/70" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl px-4 py-20 text-center">
          <h1 className="font-display text-4xl font-bold text-white drop-shadow-lg sm:text-5xl md:text-6xl">
            Encuentra tu refugio
            <span className="block text-terracotta-300">en la naturaleza</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-sand-100 drop-shadow sm:text-xl">
            Cabañas, glamping y eco-lodges rodeados de paisajes naturales únicos en México.
          </p>

          {/* Search bar */}
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl bg-white/95 p-4 shadow-2xl backdrop-blur-sm">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" />
                <input
                  type="text"
                  placeholder="¿A dónde vas?"
                  value={searchDestination}
                  onChange={(e) => setSearchDestination(e.target.value)}
                  className="w-full rounded-xl border border-sand-200 bg-white py-3 pl-10 pr-4 text-sm text-forest-950 placeholder:text-sand-400 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-200"
                />
              </div>
              <div className="relative sm:w-40">
                <Users size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" />
                <input
                  type="number"
                  min="1"
                  placeholder="Huéspedes"
                  value={searchGuests}
                  onChange={(e) => setSearchGuests(e.target.value)}
                  className="w-full rounded-xl border border-sand-200 bg-white py-3 pl-10 pr-4 text-sm text-forest-950 placeholder:text-sand-400 focus:border-forest-400 focus:outline-none focus:ring-2 focus:ring-forest-200"
                />
              </div>
              <Link
                to={`/nature-stay/search${searchDestination ? `?q=${encodeURIComponent(searchDestination)}` : ""}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-forest-700"
              >
                <Search size={18} />
                Buscar
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {!typesLoading && propertyTypes.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-forest-800">
            Tipos de alojamiento
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {propertyTypes.slice(0, 12).map((type) => {
              const Icon = CATEGORY_ICONS[type.code] || HomeIcon;
              return (
                <Link
                  key={type.id}
                  to={`/nature-stay/search?type=${type.code}`}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-sand-200 bg-white p-5 transition-all hover:border-forest-300 hover:shadow-md"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-50 text-forest-600 transition-colors group-hover:bg-forest-100 group-hover:text-forest-700">
                    <Icon size={24} />
                  </div>
                  <span className="text-sm font-medium text-forest-700 text-center">
                    {type.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Properties */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-forest-800">
            Alojamientos destacados
          </h2>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorAlert message={error} />
          ) : properties.length === 0 ? (
            <EmptyState
              icon={<Mountain size={56} />}
              title="No hay alojamientos publicados todavía"
              description="Los primeros anfitriones de Nature Stay Red aún están preparando sus espacios. Vuelve pronto para descubrir lugares increíbles."
              action={
                <Link to="/nature-stay">
                  <Button variant="secondary">Quiero ser Host</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {properties.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  propertyType={propertyTypes.find((t) => t.id === prop.property_type_id)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Host */}
      <section className="bg-gradient-to-r from-forest-700 to-forest-800 py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-bold text-white">
            ¿Tienes un espacio en la naturaleza?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-sand-200">
            Conviértete en anfitrión de Nature Stay Red y ofrece tu cabaña, glamping o eco-lodge a viajeros que buscan desconectar.
          </p>
          <Link to="/nature-stay" className="mt-8 inline-block">
            <Button variant="secondary" size="lg">
              Quiero ser Host
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
