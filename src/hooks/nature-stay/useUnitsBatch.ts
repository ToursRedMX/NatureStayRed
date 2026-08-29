import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { UnitPublic } from "@/types/nature-stay";
import { translateSupabaseError } from "@/lib/supabase-errors";

interface UnitsBatchState {
  data: Record<string, UnitPublic[]>;
  loading: boolean;
  error: string | null;
}

export function useUnitsBatch(propertyIds: string[]): UnitsBatchState {
  const [data, setData] = useState<Record<string, UnitPublic[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = propertyIds.sort().join(",");

  useEffect(() => {
    if (propertyIds.length === 0) {
      setData({});
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const { data: result, error: err } = await supabase
        .schema("nature_stay")
        .from("units_public")
        .select("*")
        .in("property_id", propertyIds)
        .order("base_price", { ascending: true });

      if (err) {
        setError(translateSupabaseError(err).message);
        setData({});
      } else {
        const grouped: Record<string, UnitPublic[]> = {};
        for (const unit of result as UnitPublic[]) {
          if (!grouped[unit.property_id]) grouped[unit.property_id] = [];
          grouped[unit.property_id].push(unit);
        }
        setData(grouped);
        setError(null);
      }
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return { data, loading, error };
}

export function getMinPrice(units: UnitPublic[] | undefined): UnitPublic | null {
  if (!units || units.length === 0) return null;
  return units.reduce((min, u) => (u.base_price < min.base_price ? u : min), units[0]);
}
