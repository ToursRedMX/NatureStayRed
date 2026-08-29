import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className, id, children, ...props }: SelectProps) {
  const selectId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-forest-800">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          "px-4 py-2.5 rounded-xl border bg-white text-forest-950 transition-all focus:outline-none focus:ring-2",
          error
            ? "border-red-400 focus:ring-red-300"
            : "border-sand-300 focus:border-forest-400 focus:ring-forest-200",
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
