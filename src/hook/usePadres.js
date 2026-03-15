import { useCallback, useState } from "react";
import useApi from "./useApi";

export const usePadres = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [padres, setPadres] = useState([]);

    const api = useApi();

    /**
     * Obtener todos los padres
     */
    const getPadres = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get("/padres");
            setPadres(response ?? []);
            return response.data;

        } catch (err) {
            console.error("❌ Error en getPadres:", err);
            setError(err.message);
            setPadres([]);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Registrar un nuevo padre — genera código automático y crea su usuario
     * @param {Object} body
     * @param {string} body.nombre
     * @param {string} body.hijo
     * @param {string} body.grado
     * @param {string} body.password   - contraseña inicial definida por el tesorero
     * @param {string|null} body.telefono
     */
    const createPadre = useCallback(async (body) => {
        try {
            if (!body.nombre) throw new Error("nombre es requerido");
            if (!body.hijo) throw new Error("hijo es requerido");
            if (!body.grado) throw new Error("grado es requerido");
            if (!body.password) throw new Error("password es requerido");

            setLoading(true);
            setError(null);

            const response = await api.post("/padres", body);
            return response;

        } catch (err) {
            console.error("❌ Error en createPadre:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Restablecer contraseña de un padre
     * @param {number} id
     * @param {string} password
     */
    const resetPassword = useCallback(async (id, password) => {
        try {
            if (!id) throw new Error("id es requerido");
            if (!password) throw new Error("password es requerido");

            setLoading(true);
            setError(null);

            const response = await api.put(`/padres/${id}/reset-password`, { password });
            return response;

        } catch (err) {
            console.error("❌ Error en resetPassword:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Obtener QR data de un padre
     * @param {number} id
     */
    const getQR = useCallback(async (id) => {
        try {
            if (!id) throw new Error("id es requerido");

            const response = await api.get(`/padres/${id}/qr`);
            return response;

        } catch (err) {
            console.error("❌ Error en getQR:", err);
            throw err;
        }
    }, [api]);

    /**
     * Eliminar un padre y su usuario asociado
     * @param {number} id
     */
    const deletePadre = useCallback(async (id) => {
        try {
            if (!id) throw new Error("id es requerido");

            setLoading(true);
            setError(null);

            const response = await api.delete(`/padres/${id}`);
            return response;

        } catch (err) {
            console.error("❌ Error en deletePadre:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    return {
        loading,
        error,
        padres,
        getPadres,
        createPadre,
        resetPassword,
        getQR,
        deletePadre,
    };
};