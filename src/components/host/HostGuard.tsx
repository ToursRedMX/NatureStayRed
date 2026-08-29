import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Lock } from "lucide-react";

export function HostGuard({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { isNatureStayHost, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={<Lock size={48} />}
          title="Inicia sesión"
          description="Necesitas una cuenta para acceder al panel de anfitriones."
        />
      </div>
    );
  }

  if (!isNatureStayHost) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <EmptyState
          icon={<Lock size={48} />}
          title="No eres anfitrión de Nature Stay"
          description="Tu cuenta no tiene el rol de Host para Nature Stay. Si crees que es un error, contacta al equipo de soporte."
        />
      </div>
    );
  }

  return <>{children}</>;
}
