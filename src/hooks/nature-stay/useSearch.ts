import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { PropertyPublic, UnitPublic, PropertyAmenityPublic } from "@/types/nature-stay";
import { translateSupabaseError } from "@/lib/supabase-errors";
import { sanitizeSearchText, buildPostgrestOrFilter } from "@/lib/search-utils";

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
      const isPriceSort = filters.sort === "price_asc" || filters.sort === "price_desc";

      // --- Phase 1: Resolve guests filter (pre-pagination) ---
      let eligibleIds: Set<string> | null = null;

      if (filters.guests && filters.guests > 0) {
        const { data: unitData, error: unitErr } = await supabase
          .schema("nature_stay")
          .from("units_public")
          .select("property_id, max_guests")
          .gte("max_guests", filters.guests);

        if (unitErr) {
          setError(translateSupabaseError(unitErr).message);
          setProperties([]);
          setTotal(0);
          setLoading(false);
          return;
        }

        eligibleIds = new Set(
          (unitData as Pick<UnitPublic, "property_id" | "max_guests">[]).map((u) => u.property_id)
        );

        if (eligibleIds.size === 0) {
          setProperties([]);
          setTotal(0);
          setError(null);
          setLoading(false);
          return;
        }
      }

      // --- Phase 2: Resolve amenities filter (pre-pagination, AND semantics) ---
      if (filters.amenities && filters.amenities.length > 0) {
        const { data: amenityData, error: amenityErr } = await supabase
          .schema("nature_stay")
          .from("property_amenities_public")
          .select("property_id, amenity_id")
          .in("amenity_id", filters.amenities);

        if (amenityErr) {
          setError(translateSupabaseError(amenityErr).message);
          setProperties([]);
          setTotal(0);
          setLoading(false);
          return;
        }

        const amenityCounts: Record<string, Set<string>> = {};
        for (const row of amenityData as PropertyAmenityPublic[]) {
          if (!amenityCounts[row.property_id]) amenityCounts[row.property_id] = new Set();
          amenityCounts[row.property_id].add(row.amenity_id);
        }

        const requiredCount = filters.amenities.length;
        const amenityEligibleIds = new Set(
          Object.entries(amenityCounts)
            .filter(([, amIds]) => amIds.size >= requiredCount)
            .map(([pid]) => pid)
        );

        if (amenityEligibleIds.size === 0) {
          setProperties([]);
          setTotal(0);
          setError(null);
          setLoading(false);
          return;
        }

        // Intersect with guests eligible IDs if present
        if (eligibleIds) {
          const intersection = new Set<string>();
          for (const id of amenityEligibleIds) {
            if (eligibleIds.has(id)) intersection.add(id);
          }
          if (intersection.size === 0) {
            setProperties([]);
            setTotal(0);
            setError(null);
            setLoading(false);
            return;
          }
          eligibleIds = intersection;
        } else {
          eligibleIds = amenityEligibleIds;
        }
      }

      // --- Phase 3: Build base property query ---
      let baseQuery = supabase
        .schema("nature_stay")
        .from("properties_public")
        .select("*", { count: "exact" });

      if (eligibleIds) {
        baseQuery = baseQuery.in("id", [...eligibleIds]);
      }

      const q = sanitizeSearchText(filters.q);
      if (q) {
        const orFilter = buildPostgrestOrFilter(["name", "city", "state", "municipality"], q);
        if (orFilter) {
          baseQuery = baseQuery.or(orFilter);
        }
      }

      const city = sanitizeSearchText(filters.city);
      if (city) {
        baseQuery = baseQuery.ilike("city", `%${city.replace(/%/g, "\\%")}%`);
      }

      const state = sanitizeSearchText(filters.state);
      if (state) {
        baseQuery = baseQuery.ilike("state", `%${state.replace(/%/g, "\\%")}%`);
      }

      if (filters.propertyType) {
        baseQuery = baseQuery.eq("property_type_id", filters.propertyType);
      }
      if (filters.petsAllowed) {
        baseQuery = baseQuery.eq("pets_allowed", true);
      }
      if (filters.instantBooking) {
        baseQuery = baseQuery.eq("instant_booking_enabled", true);
      }

      // --- Phase 4a: Price sort path (global sort, frontend pagination) ---
      if (isPriceSort) {
        // Fetch all matching properties without range
        let sortQuery = baseQuery;
        if (filters.sort === "name_asc") {
          sortQuery = sortQuery.order("name", { ascending: true });
        } else {
          sortQuery = sortQuery.order("created_at", { ascending: false });
        }

        const { data: allProps, error: allErr, count } = await sortQuery;

        if (allErr) {
          setError(translateSupabaseError(allErr).message);
          setProperties([]);
          setTotal(0);
          setLoading(false);
          return;
        }

        let allResults = allProps as PropertyPublic[];
        const totalCount = count || allResults.length;

        if (allResults.length === 0) {
          setProperties([]);
          setTotal(0);
          setError(null);
          setLoading(false);
          return;
        }

        // Fetch min price per property from units
        const propIds = allResults.map((p) => p.id);
        const { data: unitData, error: unitErr } = await supabase
          .schema("nature_stay")
          .from("units_public")
          .select("property_id, base_price")
          .in("property_id", propIds);

        if (unitErr) {
          setError(translateSupabaseError(unitErr).message);
          setProperties([]);
          setTotal(0);
          setLoading(false);
          return;
        }

        const minPriceByProp: Record<string, number> = {};
        for (const u of unitData as Pick<UnitPublic, "property_id" | "base_price">[]) {
          if (!minPriceByProp[u.property_id] || u.base_price < minPriceByProp[u.property_id]) {
            minPriceByProp[u.property_id] = u.base_price;
          }
        }

        allResults.sort((a, b) => {
          const pa = minPriceByProp[a.id] ?? Infinity;
          const pb = minPriceByProp[b.id] ?? Infinity;
          return filters.sort === "price_asc" ? pa - pb : pb - pa;
        });

        // Frontend pagination after global sort
        const page = filters.page || 1;
        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE;
        const paged = allResults.slice(from, to);

        setProperties(paged);
        setTotal(totalCount);
        setError(null);
        setLoading(false);
        return;
      }

      // --- Phase 4b: Normal sort path (server-side pagination) ---
      if (filters.sort === "name_asc") {
        baseQuery = baseQuery.order("name", { ascending: true });
      } else {
        baseQuery = baseQuery.order("created_at", { ascending: false });
      }

      const page = filters.page || 1;
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      baseQuery = baseQuery.range(from, to);

      const { data: propData, error: propErr, count } = await baseQuery;

      if (propErr) {
        setError(translateSupabaseError(propErr).message);
        setProperties([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      setProperties(propData as PropertyPublic[]);
      setTotal(count || 0);
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
