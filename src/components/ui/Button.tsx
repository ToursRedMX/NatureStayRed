import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-forest-600 text-white hover:bg-forest-700 active:bg-forest-800 shadow-sm",
    secondary: "bg-terracotta-500 text-white hover:bg-terracotta-600 active:bg-terracotta-700 shadow-sm",
    outline: "border-2 border-forest-600 text-forest-700 hover:bg-forest-50 active:bg-forest-100",
    ghost: "text-forest-700 hover:bg-forest-50 active:bg-forest-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-5 py-2.5 text-sm rounded-xl",
    lg: "px-7 py-3 text-base rounded-xl",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest-400 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
