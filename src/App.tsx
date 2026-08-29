import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { RootLayout } from "@/components/layout/RootLayout";
import { HostGuard } from "@/components/host/HostGuard";
import { MarketplacePage } from "@/pages/nature-stay/MarketplacePage";
import { SearchPage } from "@/pages/nature-stay/SearchPage";
import { PropertyDetailPage } from "@/pages/nature-stay/PropertyDetailPage";
import { UnitDetailPage } from "@/pages/nature-stay/UnitDetailPage";
import { HostPlaceholderPage } from "@/pages/host/HostPlaceholderPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/" element={<Navigate to="/nature-stay" replace />} />
            <Route path="/nature-stay" element={<MarketplacePage />} />
            <Route path="/nature-stay/search" element={<SearchPage />} />
            <Route path="/nature-stay/:slug" element={<PropertyDetailPage />} />
            <Route path="/nature-stay/:slug/unit/:unitSlug" element={<UnitDetailPage />} />

            <Route path="/host" element={<HostGuard><HostPlaceholderPage title="Panel de anfitrión" /></HostGuard>} />
            <Route path="/host/profile" element={<HostGuard><HostPlaceholderPage title="Perfil de anfitrión" /></HostGuard>} />
            <Route path="/host/properties" element={<HostGuard><HostPlaceholderPage title="Mis propiedades" /></HostGuard>} />

            <Route path="*" element={<Navigate to="/nature-stay" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
