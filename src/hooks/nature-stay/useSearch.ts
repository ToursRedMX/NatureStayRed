import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { PropertyPublic, UnitPublic, PropertyAmenityPublic } from "@/types/nature-stay";
import { translateSupabaseError } from "@/lib/supabase-errors";

export interface SearchFilters {
  q?: string;
  city?: string;
  state?: string;
  propertyType?: string;
  guests?: number;
  petsAllowed?: boolean;
  instantBooking?: boolean;
  amenities?: string[];
  sort?: string;
  page?: number;
}

interface SearchResult {
  properties: PropertyPublic[];
  total: number;
  loading: boolean;
  error: string | null;
}

const PAGE_SIZE = 24;

export function useSearch(filters: SearchFilters): SearchResult {
  const [properties, setProperties] = useState<PropertyPublic[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let propertyQuery = supabase
        .schema("nature_stay")
        .from("properties_public")
        .select("*", { count: "exact" });

      if (filters.q) {
        const q = filters.q.trim();
        propertyQuery = propertyQuery.or(
          `name.ilike.%${q}%,city.ilike.%${q}%,state.ilike.%${q}%,municipality.ilike.%${q}%`
        );
      }
      if (filters.city) {
        propertyQuery = propertyQuery.ilike("city", `%${filters.city}%`);
      }
      if (filters.state) {
        propertyQuery = propertyQuery.ilike("state", `%${filters.state}%`);
      }
      if (filters.propertyType) {
        propertyQuery = propertyQuery.eq("property_type_id", filters.propertyType);
      }
      if (filters.petsAllowed) {
        propertyQuery = propertyQuery.eq("pets_allowed", true);
      }
      if (filters.instantBooking) {
        propertyQuery = propertyQuery.eq("instant_booking_enabled", true);
      }

      const page = filters.page || 1;
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      if (filters.sort === "price_asc" || filters.sort === "price_desc") {
        // Price sorting requires units data; fetch all matching then sort in JS
      } else if (filters.sort === "name_asc") {
        propertyQuery = propertyQuery.order("name", { ascending: true });
      } else {
        propertyQuery = propertyQuery.order("created_at", { ascending: false });
      }

      propertyQuery = propertyQuery.range(from, to);

      const { data: propData, error: propErr, count } = await propertyQuery;

      if (propErr) {
        setError(translateSupabaseError(propErr).message);
        setProperties([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      let results = propData as PropertyPublic[];
      let totalCount = count || 0;

      if (filters.guests && filters.guests > 0 && results.length > 0) {
        const propIds = results.map((p) => p.id);
        const { data: unitData, error: unitErr } = await supabase
          .schema("nature_stay")
          .from("units_public")
          .select("property_id, max_guests")
          .in("property_id", propIds);

        if (unitErr) {
          setError(translateSupabaseError(unitErr).message);
          setProperties([]);
          setTotal(0);
          setLoading(false);
          return;
        }

        const eligiblePropIds = new Set(
          (unitData as Pick<UnitPublic, "property_id" | "max_guests">[])
            .filter((u) => u.max_guests >= (filters.guests as number))
            .map((u) => u.property_id)
        );

        results = results.filter((p) => eligiblePropIds.has(p.id));
        totalCount = results.length;
      }

      if (filters.amenities && filters.amenities.length > 0 && results.length > 0) {
        const propIds = results.map((p) => p.id);
        const { data: amenityData, error: amenityErr } = await supabase
          .schema("nature_stay")
          .from("property_amenities_public")
          .select("property_id, amenity_id")
          .in("property_id", propIds)
          .in("amenity_id", filters.amenities);

        if (amenityErr) {
          setError(translateSupabaseError(amenityErr).message);
          setProperties([]);
          setTotal(0);
          setLoading(false);
          return;
        }

        // AND semantics: property must have ALL selected amenities
        const amenityCounts: Record<string, Set<string>> = {};
        for (const row of amenityData as PropertyAmenityPublic[]) {
          if (!amenityCounts[row.property_id]) amenityCounts[row.property_id] = new Set();
          amenityCounts[row.property_id].add(row.amenity_id);
        }

        const requiredCount = filters.amenities.length;
        const eligiblePropIds = new Set(
          Object.entries(amenityCounts)
            .filter(([, amIds]) => amIds.size >= requiredCount)
            .map(([pid]) => pid)
        );

        results = results.filter((p) => eligiblePropIds.has(p.id));
        totalCount = results.length;
      }

      // Price sort: fetch units for all results and sort by min base_price
      if ((filters.sort === "price_asc" || filters.sort === "price_desc") && results.length > 0) {
        const propIds = results.map((p) => p.id);
        const { data: unitData } = await supabase
          .schema("nature_stay")
          .from("units_public")
          .select("property_id, base_price")
          .in("property_id", propIds);

        if (unitData) {
          const minPriceByProp: Record<string, number> = {};
          for (const u of unitData as Pick<UnitPublic, "property_id" | "base_price">[]) {
            if (!minPriceByProp[u.property_id] || u.base_price < minPriceByProp[u.property_id]) {
              minPriceByProp[u.property_id] = u.base_price;
            }
          }

          results.sort((a, b) => {
            const pa = minPriceByProp[a.id] ?? Infinity;
            const pb = minPriceByProp[b.id] ?? Infinity;
            return filters.sort === "price_asc" ? pa - pb : pb - pa;
          });
        }
      }

      setProperties(results);
      setTotal(totalCount);
      setError(null);
    } catch (err) {
      setError(translateSupabaseError(err).message);
      setProperties([]);
      setTotal(0);
    }
    setLoading(false);
  }, [
    filters.q,
    filters.city,
    filters.state,
    filters.propertyType,
    filters.guests,
    filters.petsAllowed,
    filters.instantBooking,
    filters.amenities?.join(","),
    filters.sort,
    filters.page,
  ]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  return { properties, total, loading, error };
}

export { PAGE_SIZE };
