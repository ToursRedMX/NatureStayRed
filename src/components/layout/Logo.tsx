import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/nature-stay" className={cn("flex items-center gap-2.5", className)}>
      <svg
        viewBox="0 0 48 48"
        className="h-9 w-9"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Mountains */}
        <path d="M4 36L16 18L22 26L30 14L44 36H4Z" fill="#244d22" />
        {/* Trees */}
        <path d="M10 36L13 28L16 36H10Z" fill="#2d6129" />
        <path d="M26 36L29 22L32 36H26Z" fill="#3d7a3d" />
        {/* Pin marker */}
        <path
          d="M28 8C24.5 8 22 10.5 22 14C22 18 28 26 28 26C28 26 34 18 34 14C34 10.5 31.5 8 28 8Z"
          fill="#c26530"
        />
        <circle cx="28" cy="14" r="3" fill="#fdf5f0" />
        {/* Ground */}
        <rect x="4" y="36" width="40" height="4" rx="2" fill="#ad985f" />
      </svg>
      <span className="font-display text-lg font-bold tracking-tight text-forest-800">
        Nature<span className="text-terracotta-500">Stay</span>
      </span>
    </Link>
  );
}
