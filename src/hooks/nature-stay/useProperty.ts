import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PropertyPublic } from "@/types/nature-stay";
import { translateSupabaseError } from "@/lib/supabase-errors";

interface PropertyState {
  data: PropertyPublic | null;
  loading: boolean;
  error: string | null;
}

export function useProperty(slug: string | undefined): PropertyState {
  const [data, setData] = useState<PropertyPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setData(null);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const { data: result, error: err } = await supabase
        .schema("nature_stay")
        .from("properties_public")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (err) {
        setError(translateSupabaseError(err).message);
        setData(null);
      } else {
        setData(result as PropertyPublic | null);
        setError(null);
      }
      setLoading(false);
    })();
  }, [slug]);

  return { data, loading, error };
}
