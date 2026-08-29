import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PropertyPublic } from "@/types/nature-stay";
import { translateSupabaseError } from "@/lib/supabase-errors";

interface PropertiesState {
  data: PropertyPublic[];
  loading: boolean;
  error: string | null;
}

export function useProperties(): PropertiesState {
  const [data, setData] = useState<PropertyPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: result, error: err } = await supabase
        .schema("nature_stay")
        .from("properties_public")
        .select("*")
        .order("created_at", { ascending: false });

      if (err) {
        setError(translateSupabaseError(err).message);
        setData([]);
      } else {
        setData(result as PropertyPublic[]);
        setError(null);
      }
      setLoading(false);
    })();
  }, []);

  return { data, loading, error };
}
