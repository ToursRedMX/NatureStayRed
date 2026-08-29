import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-forest-800">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "px-4 py-2.5 rounded-xl border bg-white text-forest-950 placeholder:text-sand-400 transition-all focus:outline-none focus:ring-2",
          error
            ? "border-red-400 focus:ring-red-300"
            : "border-sand-300 focus:border-forest-400 focus:ring-forest-200",
          className
        )}
        {...props}
      />
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
