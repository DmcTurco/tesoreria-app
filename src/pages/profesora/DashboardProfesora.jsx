import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import Hoy from "./Hoy";
import EscanearQR from "./EscanearQR";
import Historial from "./Historial";

export default function DashboardProfesora() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") ?? "null");
  const token = localStorage.getItem("auth_token");
  const [tab, setTab] = useState("hoy");

  if (!user || !token) {
    navigate("/role", { replace: true });
    return null;
  }

  const TABS = {
    hoy: <Hoy />,
    escanear: <EscanearQR />,
    historial: <Historial />,
  };

  return (
    <AppLayout user={user} tab={tab} onTabChange={setTab}>
      {TABS[tab] ?? <Hoy />}
    </AppLayout>
  );
}
