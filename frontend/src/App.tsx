import { HashRouter, Routes, Route, Navigate } from "react-router";
import "@/index.css";
import InventoryPage from "./pages/InventoryPages";
import { Layout } from "./components/Layout/Layout";

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<InventoryPage />} />
          <Route path="/categories" element={
            <div className="p-8">
              <h1 className="text-4xl font-extrabold tracking-tight">Categories</h1>
              <p className="text-muted-foreground mt-2 text-lg">Organize your items into groups.</p>
            </div>
          } />
          <Route path="/agenda" element={
            <div className="p-8">
              <h1 className="text-4xl font-extrabold tracking-tight">Agenda</h1>
              <p className="text-muted-foreground mt-2 text-lg">Manage your business schedule and appointments.</p>
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

export default App;
