import { Construction } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export function HostPlaceholderPage({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <EmptyState
        icon={<Construction size={56} />}
        title={title}
        description="Esta sección estará disponible en una próxima fase del desarrollo."
      />
    </div>
  );
}
