import { Outlet } from "react-router-dom";
import { NatureStayHeader } from "./NatureStayHeader";
import { NatureStayFooter } from "./NatureStayFooter";

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <NatureStayHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <NatureStayFooter />
    </div>
  );
}
