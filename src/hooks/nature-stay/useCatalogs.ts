import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PropertyType, UnitType, Amenity } from "@/types/nature-stay";
import { translateSupabaseError } from "@/lib/supabase-errors";

interface CatalogState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

function useCatalog<T extends PropertyType | UnitType | Amenity>(
  table: string
): CatalogState<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: result, error: err } = await supabase
        .schema("nature_stay")
        .from(table)
        .select("*")
        .eq("active", true)
        .order("sort_order");

      if (err) {
        setError(translateSupabaseError(err).message);
        setData([]);
      } else {
        setData(result as T[]);
        setError(null);
      }
      setLoading(false);
    })();
  }, [table]);

  return { data, loading, error };
}

export function usePropertyTypes() {
  return useCatalog<PropertyType>("property_types");
}

export function useUnitTypes() {
  return useCatalog<UnitType>("unit_types");
}

export function useAmenities() {
  return useCatalog<Amenity>("amenities");
}
