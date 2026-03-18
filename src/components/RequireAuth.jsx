// components/RequireAuth.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hook/useAuth";

export default function RequireAuth({ children, role }) {
    const { user } = useAuth();
    const token = localStorage.getItem("auth_token");

    if (!token || !user) return <Navigate to="/login" replace />;

    if (role !== undefined && user.role !== role) {
        return <Navigate to="/role" replace />;
    }

    return children;
}