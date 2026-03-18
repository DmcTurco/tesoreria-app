import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RoleSelector from "./pages/RoleSelector";
import Login from "./pages/Login";
import DashboardTesorero from "./pages/tesorero/DashboardTesorero";
import DashboardProfesora from "./pages/profesora/DashboardProfesora";
import DashboardPadre from "./pages/padre/DashboardPadre";
import RequireAuth from "./components/RequireAuth";

// Secciones tesorero
import Resumen      from "./pages/tesorero/Resumen";
import Padres       from "./pages/tesorero/Padres";
import Pagos        from "./pages/tesorero/Pagos";
import Movimientos  from "./pages/tesorero/Movimientos";
import Eventos      from "./pages/tesorero/Eventos";
import Multas       from "./pages/tesorero/Multas";
import Presupuesto  from "./pages/tesorero/Presupuesto";

function App() {
  return (
    <BrowserRouter basename="/terminal/tesoreria/">
      <Routes>
        <Route path="/"     element={<Navigate to="role" replace />} />
        <Route path="role"  element={<RoleSelector />} />
        <Route path="login" element={<Login />} />

        {/* ── Tesorero ── */}
        <Route path="dashboard" element={
          <RequireAuth role={0}><DashboardTesorero /></RequireAuth>
        }>
          <Route index                element={<Navigate to="resumen" replace />} />
          <Route path="resumen"       element={<Resumen />} />
          <Route path="padres"        element={<Padres />} />
          <Route path="pagos"         element={<Pagos />} />
          <Route path="movimientos"   element={<Movimientos />} />
          <Route path="eventos"       element={<Eventos />} />
          <Route path="multas"        element={<Multas />} />
          <Route path="presupuesto"   element={<Presupuesto />} />
        </Route>

        {/* ── Profesora ── */}
        <Route path="profesora" element={
          <RequireAuth role={1}><DashboardProfesora /></RequireAuth>
        } />

        {/* ── Padre ── */}
        <Route path="padre" element={
          <RequireAuth role={2}><DashboardPadre /></RequireAuth>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;