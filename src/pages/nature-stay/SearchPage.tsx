import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { useSearch, PAGE_SIZE, type SearchFilters } from "@/hooks/nature-stay/useSearch";
import { usePropertyTypes, useAmenities } from "@/hooks/nature-stay/useCatalogs";
import { useUnitsBatch, getMinPrice } from "@/hooks/nature-stay/useUnitsBatch";
import { usePropertyImages } from "@/hooks/nature-stay/usePropertyImages";
import { PropertyCard } from "@/components/nature-stay/PropertyCard";
import { SearchFiltersPanel } from "@/components/nature-stay/SearchFiltersPanel";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorAlert } from "@/components/ui/ErrorAlert";
import { Select } from "@/components/ui/Select";
import { supabase } from "@/lib/supabase";
import { setDocumentMeta } from "@/lib/seo";
import type { PropertyImagePublic } from "@/types/nature-stay";

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: propertyTypes } = usePropertyTypes();
  const { data: amenities } = useAmenities();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const q = searchParams.get("q") || "";
  const city = searchParams.get("city") || "";
  const state = searchParams.get("state") || "";
  const propertyTypeCode = searchParams.get("propertyType") || "";
  const guests = searchParams.get("guests") || "";
  const pets = searchParams.get("pets") === "true";
  const instant = searchParams.get("instant") === "true";
  const amenityParam = searchParams.get("amenities") || "";
  const selectedAmenities = amenityParam ? amenityParam.split(",") : [];
  const sort = searchParams.get("sort") || "";
  const page = parseInt(searchParams.get("page") || "1", 10) || 1;

  const propertyTypeId = useMemo(() => {
    if (!propertyTypeCode) return "";
    const found = propertyTypes.find((t) => t.code === propertyTypeCode);
    return found?.id || "";
  }, [propertyTypeCode, propertyTypes]);

  const filters: SearchFilters = {
    q: q || undefined,
    city: city || undefined,
    state: state || undefined,
    propertyType: propertyTypeId || undefined,
    guests: guests ? parseInt(guests, 10) : undefined,
    petsAllowed: pets || undefined,
    instantBooking: instant || undefined,
    amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
    sort: sort || undefined,
    page,
  };

  const { properties, total, loading, error } = useSearch(filters);

  // Batch fetch units for price display on cards
  const propertyIds = useMemo(() => properties.map((p) => p.id), [properties]);
  const { data: unitsByProp } = useUnitsBatch(propertyIds);

  // Batch fetch cover images for all properties
  const [coverImages, setCoverImages] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (propertyIds.length === 0) {
      setCoverImages({});
      return;
    }

    (async () => {
      // Fetch cover images in a single query for all properties
      const { data: imgData } = await supabase
        .schema("nature_stay")
        .from("property_images_public")
        .select("property_id, storage_path, is_cover, sort_order")
        .in("property_id", propertyIds)
        .order("is_cover", { ascending: false })
        .order("sort_order", { ascending: true });

      if (imgData) {
        const covers: Record<string, string | null> = {};
        for (const img of imgData as Pick<PropertyImagePublic, "property_id" | "storage_path" | "is_cover" | "sort_order">[]) {
          if (!covers[img.property_id]) {
            covers[img.property_id] = img.storage_path;
          }
        }
        setCoverImages(covers);
      }
    })();
  }, [propertyIds.join(",")]);

  useEffect(() => {
    setDocumentMeta(
      "Buscar alojamientos | Nature Stay Red",
      "Busca cabañas, glamping y eco-lodges en la naturaleza de México."
    );
  }, []);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page" && value) next.delete("page");
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
  );

  const updateAmenities = useCallback(
    (ids: string[]) => {
      updateParam("amenities", ids.join(","));
    },
    [updateParam]
  );

  const clearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  const hasActiveFilters = !!(q || city || state || propertyTypeCode || guests || pets || instant || selectedAmenities.length > 0);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const showPagination = totalPages > 1;

  const goToPage = (newPage: number) => {
    updateParam("page", newPage > 1 ? String(newPage) : "");
  };

  const filterPanelProps = {
    propertyTypes,
    amenities,
    q,
    city,
    state,
    propertyType: propertyTypeCode,
    guests,
    petsAllowed: pets,
    instantBooking: instant,
    selectedAmenities,
    onQChange: (v: string) => updateParam("q", v),
    onCityChange: (v: string) => updateParam("city", v),
    onStateChange: (v: string) => updateParam("state", v),
    onPropertyTypeChange: (v: string) => {
      const code = propertyTypes.find((t) => t.id === v)?.code || "";
      updateParam("propertyType", code);
    },
    onGuestsChange: (v: string) => updateParam("guests", v),
    onPetsChange: (v: boolean) => updateParam("pets", v ? "true" : ""),
    onInstantChange: (v: boolean) => updateParam("instant", v ? "true" : ""),
    onAmenitiesChange: updateAmenities,
    hasActiveFilters,
    onClear: clearFilters,
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold text-forest-800">
          Buscar alojamientos
        </h1>
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-sand-200 bg-white px-4 py-2 text-sm font-medium text-forest-700 lg:hidden"
          aria-expanded={mobileFiltersOpen}
          aria-controls="mobile-filters"
        >
          <SlidersHorizontal size={16} />
          Filtros
        </button>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row">
        {/* Desktop filters sidebar */}
        <aside className="hidden lg:block lg:w-72 lg:flex-shrink-0">
          <SearchFiltersPanel {...filterPanelProps} />
        </aside>

        {/* Mobile filters drawer */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden" id="mobile-filters">
            <div
              className="absolute inset-0 bg-forest-950/50"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-sand-50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-forest-800">Filtros</h2>
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="rounded-lg p-2 text-forest-600 hover:bg-forest-50"
                  aria-label="Cerrar filtros"
                >
                  <X size={20} />
                </button>
              </div>
              <SearchFiltersPanel {...filterPanelProps} />
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="mt-4 w-full rounded-xl bg-forest-600 py-3 text-sm font-medium text-white"
              >
                Ver {total} resultados
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-sand-600">
              {loading ? "Buscando..." : `${total} resultado${total !== 1 ? "s" : ""}`}
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} className="text-sand-500" />
              <Select
                value={sort}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  updateParam("sort", e.target.value)
                }
                aria-label="Ordenar resultados"
                className="w-48"
              >
                <option value="">Relevancia</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="name_asc">Nombre: A-Z</option>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <ErrorAlert message={error} />
          ) : properties.length === 0 ? (
            <EmptyState
              icon={<Search size={48} />}
              title="No encontramos alojamientos"
              description={
                hasActiveFilters
                  ? "Prueba ajustar los filtros o buscar otro destino."
                  : "Aún no hay alojamientos publicados. Vuelve pronto para descubrir lugares increíbles."
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {properties.map((prop) => {
                  const units = unitsByProp[prop.id];
                  const minPriceUnit = getMinPrice(units);
                  return (
                    <PropertyCard
                      key={prop.id}
                      property={prop}
                      propertyType={propertyTypes.find((t) => t.id === prop.property_type_id)}
                      coverImageStoragePath={coverImages[prop.id] || null}
                      minPrice={minPriceUnit?.base_price ?? null}
                      priceCurrency={minPriceUnit?.currency ?? null}
                      priceMode={minPriceUnit?.pricing_mode ?? null}
                    />
                  );
                })}
              </div>

              {showPagination && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1 rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm font-medium text-forest-700 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                  <span className="px-4 text-sm font-medium text-forest-700">
                    Página {page} de {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    className="inline-flex items-center gap-1 rounded-lg border border-sand-200 bg-white px-3 py-2 text-sm font-medium text-forest-700 disabled:opacity-40"
                  >
                    Siguiente <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
