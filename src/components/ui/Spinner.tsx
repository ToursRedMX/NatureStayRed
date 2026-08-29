import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("animate-spin text-forest-500", className)}
      size={24}
    />
  );
}
