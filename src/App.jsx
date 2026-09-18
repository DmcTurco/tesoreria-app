import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import DashboardTesorero from "./pages/tesorero/DashboardTesorero";
import RequireAuth from "./components/RequireAuth";

// Secciones tesorero
import Resumen      from "./pages/tesorero/Resumen";
import Padres       from "./pages/tesorero/Padres";
import Pagos        from "./pages/tesorero/Pagos";
import Movimientos  from "./pages/tesorero/Movimientos";
import Eventos      from "./pages/tesorero/Eventos";
import Multas       from "./pages/tesorero/Multas";
import Presupuesto       from "./pages/tesorero/Presupuesto";
import ExportarImportar  from "./pages/tesorero/ExportarImportar";
import AdminDB           from "./pages/tesorero/AdminDB";
import NuevoAbono        from "./pages/tesorero/NuevoAbono";
import ReporteDeudores   from "./pages/tesorero/ReporteDeudores";
import Balance           from "./pages/tesorero/Balance";

function App() {
  return (
    <BrowserRouter basename="/terminal/tesoreria/">
      <Routes>
        <Route path="/"     element={<Navigate to="login" replace />} />
        <Route path="login" element={<Login />} />

        {/* ── Tesorero ── */}
        <Route path="dashboard" element={
          <RequireAuth role={0}><DashboardTesorero /></RequireAuth>
        }>
          <Route index                element={<Navigate to="resumen" replace />} />
          <Route path="resumen"       element={<Resumen />} />
          <Route path="padres"        element={<Padres />} />
          <Route path="pagos"         element={<Pagos />} />
          <Route path="pagos/nuevo"   element={<NuevoAbono />} />
          <Route path="movimientos"   element={<Movimientos />} />
          <Route path="eventos"       element={<Eventos />} />
          <Route path="multas"        element={<Multas />} />
          <Route path="presupuesto"   element={<Presupuesto />} />
          <Route path="exportar"        element={<ExportarImportar />} />
          <Route path="reporte-deudores" element={<ReporteDeudores />} />
          <Route path="balance"          element={<Balance />} />
          <Route path="admin"         element={<AdminDB />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;