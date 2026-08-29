import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      {icon && <div className="mb-4 text-forest-300">{icon}</div>}
      <h3 className="text-lg font-semibold text-forest-800">{title}</h3>
      {description && (
        <p className="mt-2 max-w-md text-sm text-forest-600">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
