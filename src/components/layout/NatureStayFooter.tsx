import { Link } from "react-router-dom";
export function NatureStayFooter() {
  return (
    <footer className="border-t border-sand-200 bg-forest-950 text-sand-100">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <div className="inline-flex rounded-xl bg-white p-2">
              <img
                src="/LogoNatureStayRed.PNG"
                alt="Nature Stay Red — Hospedajes en la naturaleza"
                className="h-16 w-auto object-contain"
              />
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
