import { useCallback, useState } from "react";
import useApi from "./useApi";

export const useLogin = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const api = useApi();

    /**
     * Iniciar sesión con username + password
     * @param {Object} credentials
     * @param {string} credentials.username
     * @param {string} credentials.password
     * @returns {{ token: string, user: Object }}
     */
    const login = useCallback(async ({ username, password }) => {
        try {
            if (!username) throw new Error("El usuario es requerido");
            if (!password) throw new Error("La contraseña es requerida");

            setLoading(true);
            setError(null);

            const response = await api.post("/login", { username, password });

            // El apiService ya retorna los datos directamente, no un objeto axios
            const { token, user } = response;

            // Usar la misma key que api.js → TOKEN_KEY = 'auth_token'
            localStorage.setItem("auth_token", token);
            localStorage.setItem("user", JSON.stringify(user));

            return { token, user };

        } catch (err) {
            const msg = err.response?.data?.message ?? err.message ?? "Usuario o contraseña incorrectos";
            console.error("❌ Error en login:", msg);
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Cerrar sesión — limpia localStorage y llama al endpoint
     */
    const logout = useCallback(async () => {
        try {
            await api.post("/logout");
        } catch {
            // Si el token ya expiró el endpoint puede fallar — no importa
        } finally {
            localStorage.removeItem("auth_token");
            localStorage.removeItem("user");
        }
    }, [api]);

    /**
     * Cambiar contraseña del usuario autenticado
     * @param {Object} body
     * @param {string} body.password_actual
     * @param {string} body.password_nuevo
     * @param {string} body.password_nuevo_confirmation
     */
    const cambiarPassword = useCallback(async ({ password_actual, password_nuevo, password_nuevo_confirmation }) => {
        try {
            if (!password_actual) throw new Error("La contraseña actual es requerida");
            if (!password_nuevo) throw new Error("La nueva contraseña es requerida");

            setLoading(true);
            setError(null);

            const response = await api.put("/cambiar-password", {
                password_actual,
                password_nuevo,
                password_nuevo_confirmation: password_nuevo_confirmation ?? password_nuevo,
            });

            return response;

        } catch (err) {
            const msg = err.response?.data?.message ?? err.message ?? "Error al cambiar contraseña";
            setError(msg);
            throw new Error(msg);
        } finally {
            setLoading(false);
        }
    }, [api]);

    return {
        loading,
        error,
        login,
        logout,
        cambiarPassword,
    };
};