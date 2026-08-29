import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PropertyAmenityPublic, Amenity } from "@/types/nature-stay";
import { translateSupabaseError } from "@/lib/supabase-errors";

interface PropertyAmenitiesState {
  data: Amenity[];
  loading: boolean;
  error: string | null;
}

export function usePropertyAmenities(propertyId: string | undefined): PropertyAmenitiesState {
  const [data, setData] = useState<Amenity[]>([]);
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

      const { data: mappings, error: err } = await supabase
        .schema("nature_stay")
        .from("property_amenities_public")
        .select("amenity_id")
        .eq("property_id", propertyId);

      if (err) {
        setError(translateSupabaseError(err).message);
        setData([]);
        setLoading(false);
        return;
      }

      const amenityIds = (mappings as PropertyAmenityPublic[]).map((m) => m.amenity_id);

      if (amenityIds.length === 0) {
        setData([]);
        setError(null);
        setLoading(false);
        return;
      }

      const { data: amenities, error: err2 } = await supabase
        .schema("nature_stay")
        .from("amenities")
        .select("*")
        .in("id", amenityIds)
        .order("category")
        .order("sort_order");

      if (err2) {
        setError(translateSupabaseError(err2).message);
        setData([]);
      } else {
        setData(amenities as Amenity[]);
        setError(null);
      }
      setLoading(false);
    })();
  }, [propertyId]);

  return { data, loading, error };
}
