import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { UnitImagePublic } from "@/types/nature-stay";
import { translateSupabaseError } from "@/lib/supabase-errors";

interface UnitImagesState {
  data: UnitImagePublic[];
  loading: boolean;
  error: string | null;
}

export function useUnitImages(unitId: string | undefined): UnitImagesState {
  const [data, setData] = useState<UnitImagePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!unitId) {
      setData([]);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const { data: result, error: err } = await supabase
        .schema("nature_stay")
        .from("unit_images_public")
        .select("*")
        .eq("unit_id", unitId)
        .order("is_cover", { ascending: false })
        .order("sort_order");

      if (err) {
        setError(translateSupabaseError(err).message);
        setData([]);
      } else {
        setData(result as UnitImagePublic[]);
        setError(null);
      }
      setLoading(false);
    })();
  }, [unitId]);

  return { data, loading, error };
}
