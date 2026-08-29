import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import { useProperties } from "@/hooks/nature-stay/useProperties";
import { usePropertyTypes } from "@/hooks/nature-stay/useCatalogs";
import { PropertyCard } from "@/components/nature-stay/PropertyCard";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { PropertyPublic } from "@/types/nature-stay";

export function SearchPage() {
  const { data: allProperties, loading, error } = useProperties();
  const { data: propertyTypes } = usePropertyTypes();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "");
  const [guests, setGuests] = useState("");
  const [petsOnly, setPetsOnly] = useState(false);
  const [instantOnly, setInstantOnly] = useState(false);

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
    setTypeFilter(searchParams.get("type") || "");
  }, [searchParams]);

  const filtered: PropertyPublic[] = allProperties.filter((p) => {
    if (query) {
      const q = query.toLowerCase();
      const matches =
        p.name.toLowerCase().includes(q) ||
        (p.city?.toLowerCase().includes(q) ?? false) ||
        (p.state?.toLowerCase().includes(q) ?? false) ||
        (p.short_description?.toLowerCase().includes(q) ?? false);
      if (!matches) return false;
    }
    if (typeFilter) {
      const type = propertyTypes.find((t) => t.code === typeFilter);
      if (type && p.property_type_id !== type.id) return false;
    }
    if (petsOnly && !p.pets_allowed) return false;
    if (instantOnly && !p.instant_booking_enabled) return false;
    return true;
  });

  const updateSearch = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-bold text-forest-800">
        Buscar alojamientos
      </h1>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row">
        {/* Filters sidebar */}
        <aside className="lg:w-72 lg:flex-shrink-0">
          <div className="rounded-2xl border border-sand-200 bg-white p-5">
            <div className="flex items-center gap-2 text-forest-700">
              <SlidersHorizontal size={18} />
              <h2 className="font-semibold">Filtros</h2>
            </div>

            <div className="mt-4 space-y-4">
              <div className="relative">
                <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" />
                <Input
                  placeholder="Destino"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    updateSearch("q", e.target.value);
                  }}
                  className="pl-9"
                />
              </div>

              <Select
                value={typeFilter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                  setTypeFilter(e.target.value);
                  updateSearch("type", e.target.value);
                }}
              >
                <option value="">Todos los tipos</option>
                {propertyTypes.map((t) => (
                  <option key={t.id} value={t.code}>{t.name}</option>
                ))}
              </Select>

              <Input
                type="number"
                min="1"
                placeholder="Huéspedes"
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
              />

              <label className="flex items-center gap-2 text-sm text-forest-700">
                <input
                  type="checkbox"
                  checked={petsOnly}
                  onChange={(e) => setPetsOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-sand-300 text-forest-600 focus:ring-forest-400"
                />
                Pet friendly
              </label>

              <label className="flex items-center gap-2 text-sm text-forest-700">
                <input
                  type="checkbox"
                  checked={instantOnly}
                  onChange={(e) => setInstantOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-sand-300 text-forest-600 focus:ring-forest-400"
                />
                Reserva inmediata
              </label>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1">
          <div className="mb-4 text-sm text-sand-600">
            {loading ? "Buscando..." : `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""}`}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorAlert message={error} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Search size={48} />}
              title="No encontramos alojamientos"
              description="Prueba ajustar los filtros o buscar otro destino."
            />
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((prop) => (
                <PropertyCard
                  key={prop.id}
                  property={prop}
                  propertyType={propertyTypes.find((t) => t.id === prop.property_type_id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
