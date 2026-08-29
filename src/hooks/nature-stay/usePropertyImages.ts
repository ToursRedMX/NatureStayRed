import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PropertyImagePublic } from "@/types/nature-stay";
import { translateSupabaseError } from "@/lib/supabase-errors";

interface PropertyImagesState {
  data: PropertyImagePublic[];
  loading: boolean;
  error: string | null;
}

export function usePropertyImages(propertyId: string | undefined): PropertyImagesState {
  const [data, setData] = useState<PropertyImagePublic[]>([]);
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
        .from("property_images_public")
        .select("*")
        .eq("property_id", propertyId)
        .order("sort_order");

      if (err) {
        setError(translateSupabaseError(err).message);
        setData([]);
      } else {
        setData(result as PropertyImagePublic[]);
        setError(null);
      }
      setLoading(false);
    })();
  }, [propertyId]);

  return { data, loading, error };
}
