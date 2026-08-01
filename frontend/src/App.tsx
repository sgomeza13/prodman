import { HashRouter, Routes, Route, Navigate } from "react-router";
import "@/index.css";
import InventoryPage from "./pages/InventoryPages";
import BrandsPage from "./pages/BrandsPage";
import ProvidersPage from "./pages/ProvidersPage";
import CategoriesPage from "./pages/CategoriesPage";
import PosPage from "./pages/PosPage";
import PurchasesPage from "./pages/PurchasesPage";
import SalesHistoryPage from "./pages/SalesHistoryPage";
import ReportsPage from "./pages/ReportsPage";
import SettingsPage from "./pages/SettingsPage";
import { Layout } from "./components/Layout/Layout";

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<InventoryPage />} />
          <Route path="/pos" element={<PosPage />} />
          <Route path="/purchases" element={<PurchasesPage />} />
          <Route path="/sales" element={<SalesHistoryPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/brands" element={<BrandsPage />} />
          <Route path="/providers" element={<ProvidersPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
