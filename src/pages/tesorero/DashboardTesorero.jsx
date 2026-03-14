import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import Resumen from "./Resumen";
import Padres from "./Padres";
import Pagos from "./Pagos";
import Movimientos from "./Movimientos";
import Eventos from "./Eventos";
import Multas from "./Multas";
import Presupuesto from "./Presupuesto";

export default function DashboardTesorero() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") ?? "null");
  const [tab, setTab] = useState("resumen");

  // Si no hay sesión válida redirigir
  if (!user) {
    navigate("/role", { replace: true });
    return null;
  }

  const TABS = {
    resumen: <Resumen onTabChange={setTab} />,
    padres: <Padres />,
    pagos: <Pagos />,
    movimientos: <Movimientos />,
    eventos: <Eventos />,
    multas: <Multas />,
    presupuesto: <Presupuesto />,
  };

  return (
    <AppLayout user={user} tab={tab} onTabChange={setTab}>
      {TABS[tab] ?? <Resumen onTabChange={setTab} />}
    </AppLayout>
  );
}
