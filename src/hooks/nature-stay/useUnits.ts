import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { UnitPublic } from "@/types/nature-stay";
import { translateSupabaseError } from "@/lib/supabase-errors";

interface UnitsState {
  data: UnitPublic[];
  loading: boolean;
  error: string | null;
}

export function useUnits(propertyId: string | undefined): UnitsState {
  const [data, setData] = useState<UnitPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) {
      setData([]);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const { data: result, error: err } = await supabase
        .schema("nature_stay")
        .from("units_public")
        .select("*")
        .eq("property_id", propertyId)
        .order("base_price", { ascending: true });

      if (err) {
        setError(translateSupabaseError(err).message);
        setData([]);
      } else {
        setData(result as UnitPublic[]);
        setError(null);
      }
      setLoading(false);
    })();
  }, [propertyId]);

  return { data, loading, error };
}
