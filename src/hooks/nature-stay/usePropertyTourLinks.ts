import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { PropertyTourLinkPublic, TourPublic } from "@/types/nature-stay";
import { translateSupabaseError } from "@/lib/supabase-errors";

interface TourLinksState {
  links: PropertyTourLinkPublic[];
  tours: TourPublic[];
  loading: boolean;
  error: string | null;
}

export function usePropertyTourLinks(propertyId: string | undefined): TourLinksState {
  const [links, setLinks] = useState<PropertyTourLinkPublic[]>([]);
  const [tours, setTours] = useState<TourPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!propertyId) {
      setLinks([]);
      setTours([]);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);

      const { data: linkRows, error: err } = await supabase
        .schema("nature_stay")
        .from("property_tour_links_public")
        .select("*")
        .eq("property_id", propertyId)
        .order("display_order");

      if (err) {
        setError(translateSupabaseError(err).message);
        setLinks([]);
        setTours([]);
        setLoading(false);
        return;
      }

      const typedLinks = linkRows as PropertyTourLinkPublic[];
      setLinks(typedLinks);

      if (typedLinks.length === 0) {
        setTours([]);
        setError(null);
        setLoading(false);
        return;
      }

      const tourIds = typedLinks.map((l) => l.tour_id);

      const { data: tourRows, error: err2 } = await supabase
        .from("tours")
        .select("id, name, slug, description, image_url, price, destination")
        .in("id", tourIds);

      if (err2) {
        setError(translateSupabaseError(err2).message);
        setTours([]);
      } else {
        setTours(tourRows as TourPublic[]);
        setError(null);
      }
      setLoading(false);
    })();
  }, [propertyId]);

  return { links, tours, loading, error };
}
