import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { HostPublicInfo } from "@/types/nature-stay";
import { translateSupabaseError } from "@/lib/supabase-errors";

interface HostInfoState {
  data: HostPublicInfo | null;
  loading: boolean;
  error: string | null;
}

export function useHostInfo(hostId: string | undefined): HostInfoState {
  const [data, setData] = useState<HostPublicInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hostId) {
      setData(null);
      setLoading(false);
      return;
    }

    (async () => {
      setLoading(true);
      const { data: result, error: err } = await supabase
        .schema("nature_stay")
        .from("host_public_info")
        .select("*")
        .eq("id", hostId)
        .maybeSingle();

      if (err) {
        setError(translateSupabaseError(err).message);
        setData(null);
      } else {
        setData(result as HostPublicInfo | null);
        setError(null);
      }
      setLoading(false);
    })();
  }, [hostId]);

  return { data, loading, error };
}
