import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RoleSelector from "./pages/RoleSelector";
import Login from "./pages/Login";
import DashboardTesorero from "./pages/tesorero/DashboardTesorero";
import DashboardProfesora from "./pages/profesora/DashboardProfesora";
import DashboardPadre from "./pages/padre/DashboardPadre";

function App() {
  return (
    <BrowserRouter basename="/terminal/tesoreria/">
      <Routes>
        <Route path="/" element={<Navigate to="role" replace />} />
        <Route path="role" element={<RoleSelector />} />
        <Route path="login" element={<Login />} />
        <Route path="dashboard" element={<DashboardTesorero />} />
        <Route path="profesora" element={<DashboardProfesora />} />
        <Route path="padre" element={<DashboardPadre />} />
        {/* próximas rutas */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
