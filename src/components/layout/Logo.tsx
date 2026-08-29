import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/nature-stay" className={cn("flex items-center", className)}>
      <img
        src="/LogoNatureStayRed.PNG"
        alt="Nature Stay Red — Hospedajes en la naturaleza"
        className="h-16 w-auto object-contain"
      />
    </Link>
  );
}
