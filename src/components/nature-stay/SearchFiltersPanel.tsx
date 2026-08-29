import { SlidersHorizontal, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { PropertyType, Amenity } from "@/types/nature-stay";

interface SearchFiltersPanelProps {
  propertyTypes: PropertyType[];
  amenities: Amenity[];

  q: string;
  city: string;
  state: string;
  propertyType: string;
  guests: string;
  petsAllowed: boolean;
  instantBooking: boolean;
  selectedAmenities: string[];

  onQChange: (v: string) => void;
  onCityChange: (v: string) => void;
  onStateChange: (v: string) => void;
  onPropertyTypeChange: (v: string) => void;
  onGuestsChange: (v: string) => void;
  onPetsChange: (v: boolean) => void;
  onInstantChange: (v: boolean) => void;
  onAmenitiesChange: (ids: string[]) => void;

  hasActiveFilters: boolean;
  onClear: () => void;
}

export function SearchFiltersPanel({
  propertyTypes,
  amenities,
  q,
  city,
  state,
  propertyType,
  guests,
  petsAllowed,
  instantBooking,
  selectedAmenities,
  onQChange,
  onCityChange,
  onStateChange,
  onPropertyTypeChange,
  onGuestsChange,
  onPetsChange,
  onInstantChange,
  onAmenitiesChange,
  hasActiveFilters,
  onClear,
}: SearchFiltersPanelProps) {
  const amenityCategories = [...new Set(amenities.map((a) => a.category))].sort();

  const toggleAmenity = (id: string) => {
    if (selectedAmenities.includes(id)) {
      onAmenitiesChange(selectedAmenities.filter((a) => a !== id));
    } else {
      onAmenitiesChange([...selectedAmenities, id]);
    }
  };

  return (
    <div className="rounded-2xl border border-sand-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-forest-700">
          <SlidersHorizontal size={18} />
          <h2 className="font-semibold">Filtros</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs font-medium text-terracotta-600 hover:text-terracotta-700"
          >
            <X size={14} /> Limpiar
          </button>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-400" />
          <Input
            placeholder="Destino (nombre, ciudad, estado)"
            value={q}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onQChange(e.target.value)}
            className="pl-9"
            aria-label="Buscar por destino"
          />
        </div>

        <Input
          placeholder="Ciudad"
          value={city}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onCityChange(e.target.value)}
          aria-label="Filtrar por ciudad"
        />

        <Input
          placeholder="Estado"
          value={state}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onStateChange(e.target.value)}
          aria-label="Filtrar por estado"
        />

        <Select
          value={propertyType}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onPropertyTypeChange(e.target.value)}
          aria-label="Tipo de alojamiento"
        >
          <option value="">Todos los tipos</option>
          {propertyTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>

        <Input
          type="number"
          min="1"
          placeholder="Huéspedes mínimos"
          value={guests}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onGuestsChange(e.target.value)}
          aria-label="Numero minimo de huespedes"
        />

        <label className="flex items-center gap-2 text-sm text-forest-700">
          <input
            type="checkbox"
            checked={petsAllowed}
            onChange={(e) => onPetsChange(e.target.checked)}
            className="h-4 w-4 rounded border-sand-300 text-forest-600 focus:ring-forest-400"
          />
          Pet friendly
        </label>

        <label className="flex items-center gap-2 text-sm text-forest-700">
          <input
            type="checkbox"
            checked={instantBooking}
            onChange={(e) => onInstantChange(e.target.checked)}
            className="h-4 w-4 rounded border-sand-300 text-forest-600 focus:ring-forest-400"
          />
          Reserva inmediata
        </label>

        {amenities.length > 0 && (
          <div>
            <p className="text-sm font-medium text-forest-700">Servicios</p>
            <p className="text-xs text-sand-500">El alojamiento debe tener todos los seleccionados</p>
            <div className="mt-2 max-h-48 space-y-3 overflow-y-auto pr-1">
              {amenityCategories.map((cat) => (
                <div key={cat}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-sand-500">
                    {cat}
                  </p>
                  <div className="mt-1 space-y-1">
                    {amenities
                      .filter((a) => a.category === cat)
                      .map((a) => (
                        <label
                          key={a.id}
                          className="flex items-center gap-2 text-sm text-forest-700"
                        >
                          <input
                            type="checkbox"
                            checked={selectedAmenities.includes(a.id)}
                            onChange={() => toggleAmenity(a.id)}
                            className="h-4 w-4 rounded border-sand-300 text-forest-600 focus:ring-forest-400"
                          />
                          {a.name}
                        </label>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
