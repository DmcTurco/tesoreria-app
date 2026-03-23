import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";

export default function DashboardPadre() {
  const navigate = useNavigate();
  const location = useLocation();
  const user     = JSON.parse(localStorage.getItem("user") ?? "null");
  const token    = localStorage.getItem("auth_token");

  if (!user || !token) return <Navigate to="/role" replace />;

  const tab = location.pathname.split("/").pop();

  return (
    <AppLayout user={user} tab={tab} onTabChange={(t) => navigate(t)}>
      <Outlet />
    </AppLayout>
  );
}