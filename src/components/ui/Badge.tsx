import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-sand-100 text-sand-800 border-sand-300",
    success: "bg-forest-100 text-forest-700 border-forest-300",
    warning: "bg-terracotta-100 text-terracotta-700 border-terracotta-300",
    error: "bg-red-100 text-red-700 border-red-300",
    info: "bg-blue-100 text-blue-700 border-blue-300",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
