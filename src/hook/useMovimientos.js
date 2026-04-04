import { useCallback, useState } from "react";
import useApi from "./useApi";

export const useMovimientos = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [movimientos, setMovimientos] = useState([]);
    const [totalRegistros, setTotalRegistros] = useState(0);
    const [totalIngresos, setTotalIngresos] = useState(0);
    const [totalEgresos, setTotalEgresos] = useState(0);
    const [saldo, setSaldo] = useState(0);

    const api = useApi();

    /**
     * Obtener movimientos con filtros opcionales
     * @param {Object} params
     * @param {number|null} params.tipo         - 0 ingreso | 1 egreso | null todos
     * @param {string|null} params.categoria
     * @param {string|null} params.fecha_inicio - YYYY-MM-DD
     * @param {string|null} params.fecha_fin    - YYYY-MM-DD
     */
    const getMovimientos = useCallback(async ({ tipo = null, categoria = null, fecha_inicio = null, fecha_fin = null, page = 1, per_page = 5 } = {}) => {
        try {
            setLoading(true);
            setError(null);

            const params = { page, per_page };
            if (tipo !== null) params.tipo = tipo;
            if (categoria !== null) params.categoria = categoria;
            if (fecha_inicio !== null) params.fecha_inicio = fecha_inicio;
            if (fecha_fin !== null) params.fecha_fin = fecha_fin;

            const response = await api.get("/movimientos", { params });

            // El backend devuelve { data, total, total_ingresos, total_egresos, saldo }
            setMovimientos(response.data ?? []);
            setTotalRegistros(response.total ?? 0);
            setTotalIngresos(response.total_ingresos ?? 0);
            setTotalEgresos(response.total_egresos ?? 0);
            setSaldo(response.saldo ?? 0);

            return response.data;

        } catch (err) {
            console.error("❌ Error en getMovimientos:", err);
            setError(err.message);
            setMovimientos([]);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Crear un movimiento manual (ingreso o egreso)
     * @param {Object} body
     * @param {number}      body.tipo         - 0 ingreso | 1 egreso
     * @param {number}      body.monto
     * @param {string}      body.descripcion
     * @param {string}      body.categoria
     * @param {string}      body.fecha        - YYYY-MM-DD
     * @param {string|null} body.comprobante
     * @param {string|null} body.observaciones
     */
    const createMovimiento = useCallback(async (body) => {
        try {
            if (body.tipo === undefined) throw new Error("tipo es requerido");
            if (!body.monto) throw new Error("monto es requerido");
            if (!body.descripcion) throw new Error("descripcion es requerida");

            setLoading(true);
            setError(null);

            const response = await api.post("/movimientos", body);
            return response;

        } catch (err) {
            console.error("❌ Error en createMovimiento:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Eliminar un movimiento
     * @param {number} id
     */
    const deleteMovimiento = useCallback(async (id) => {
        try {
            if (!id) throw new Error("id es requerido");

            setLoading(true);
            setError(null);

            const response = await api.delete(`/movimientos/${id}`);
            return response;

        } catch (err) {
            console.error("❌ Error en deleteMovimiento:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    return {
        loading,
        error,
        movimientos,
        totalRegistros,
        totalIngresos,
        totalEgresos,
        saldo,
        getMovimientos,
        createMovimiento,
        deleteMovimiento,
    };
};