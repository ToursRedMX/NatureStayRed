import { Link, useLocation } from "react-router-dom";
import { Menu, X, Home, LayoutDashboard, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Logo } from "./Logo";
import { cn } from "@/lib/utils";

export function NatureStayHeader() {
  const { user } = useAuth();
  const { isNatureStayHost, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { to: "/nature-stay", label: "Explorar", icon: Home },
    { to: "/nature-stay/search", label: "Buscar", icon: Home },
  ];

  const isActive = (path: string) => {
    if (path === "/nature-stay") return location.pathname === "/nature-stay";
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-sand-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                isActive(link.to)
                  ? "bg-forest-50 text-forest-700"
                  : "text-forest-600 hover:bg-forest-50 hover:text-forest-700"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!roleLoading && isNatureStayHost && (
            <Link
              to="/host"
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-forest-600 hover:bg-forest-50 hover:text-forest-700 transition-colors"
            >
              <LayoutDashboard size={16} />
              Panel Host
            </Link>
          )}
          {user ? (
            <Link
              to="/host/profile"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-forest-700"
            >
              <User size={16} />
              {user.email?.split("@")[0]}
            </Link>
          ) : (
            <Link
              to="/nature-stay"
              className="inline-flex items-center gap-2 rounded-xl bg-forest-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-forest-700 transition-colors"
            >
              Quiero ser Host
            </Link>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-forest-700 hover:bg-forest-50 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menú"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="border-t border-sand-200 bg-white px-4 py-3 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-forest-700 hover:bg-forest-50"
            >
              {link.label}
            </Link>
          ))}
          {!roleLoading && isNatureStayHost && (
            <Link
              to="/host"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-4 py-2.5 text-sm font-medium text-forest-700 hover:bg-forest-50"
            >
              Panel Host
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
