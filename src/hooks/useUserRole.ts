import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/types/nature-stay";

interface UserRoleInfo {
  roles: UserRole[];
  isNatureStayHost: boolean;
  isSuperAdmin: boolean;
  loading: boolean;
}

export function useUserRole(): UserRoleInfo {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role, platform, is_active")
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) {
        setRoles([]);
      } else {
        setRoles(data as UserRole[]);
      }
      setLoading(false);
    })();
  }, [user, authLoading]);

  const isNatureStayHost = roles.some(
    (r) => r.role === "host" && r.platform === "naturestayred" && r.is_active
  );
  const isSuperAdmin = roles.some(
    (r) => r.role === "super_admin" && r.platform === "global" && r.is_active
  );

  return { roles, isNatureStayHost, isSuperAdmin, loading };
}
