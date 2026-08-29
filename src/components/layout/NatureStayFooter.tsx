import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export function NatureStayFooter() {
  return (
    <footer className="border-t border-sand-200 bg-forest-950 text-sand-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 36L16 18L22 26L30 14L44 36H4Z" fill="#5e9b5e" />
                <path d="M28 8C24.5 8 22 10.5 22 14C22 18 28 26 28 26C28 26 34 18 34 14C34 10.5 31.5 8 28 8Z" fill="#d4824f" />
                <circle cx="28" cy="14" r="3" fill="#fdf5f0" />
                <rect x="4" y="36" width="40" height="4" rx="2" fill="#998452" />
              </svg>
              <span className="font-display text-base font-bold text-white">
                Nature Stay <span className="text-terracotta-400">Red</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-sand-300">
              Alojamientos rodeados de naturaleza. Encuentra tu refugio perfecto.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <h4 className="text-sm font-semibold text-white">Explorar</h4>
              <ul className="mt-3 space-y-2 text-sm text-sand-300">
                <li><Link to="/nature-stay" className="hover:text-white transition-colors">Inicio</Link></li>
                <li><Link to="/nature-stay/search" className="hover:text-white transition-colors">Buscar</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Anfitriones</h4>
              <ul className="mt-3 space-y-2 text-sm text-sand-300">
                <li><Link to="/nature-stay" className="hover:text-white transition-colors">Quiero ser Host</Link></li>
                <li><Link to="/host" className="hover:text-white transition-colors">Panel Host</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-forest-800 pt-6 text-center text-xs text-sand-400">
          © {new Date().getFullYear()} Nature Stay Red · Parte del ecosistema Red
        </div>
      </div>
    </footer>
  );
}
