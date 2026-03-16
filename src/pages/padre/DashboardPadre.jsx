import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import MiEstado from "./MiEstado";
import MiQR from "./MiQR";
import Transparencia from "./Transparencia";

export default function DashboardPadre() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") ?? "null");
  const token = localStorage.getItem("auth_token");
  const [tab, setTab] = useState("estado");

  if (!user || !token) {
    navigate("/role", { replace: true });
    return null;
  }

  const TABS = {
    estado: <MiEstado />,
    qr: <MiQR />,
    eventos: <Transparencia />,
  };

  return (
    <AppLayout user={user} tab={tab} onTabChange={setTab}>
      {TABS[tab] ?? <MiEstado />}
    </AppLayout>
  );
}
