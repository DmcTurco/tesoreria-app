import { useCallback, useState } from "react";
import useApi from "./useApi";

export const usePresupuesto = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [presupuestos, setPresupuestos] = useState([]);
    const [gastosReales, setGastosReales] = useState({});

    const api = useApi();

    /**
     * Obtener presupuestos con comparativa de gastos reales
     * @param {Object} params
     * @param {number} params.anio  - Año (requerido)
     * @param {number|null} params.mes - Mes 1-12 o null para anual
     */
    const getPresupuestos = useCallback(async ({ anio, mes = null }) => {
        try {
            if (!anio) throw new Error("anio es requerido");

            setLoading(true);
            setError(null);

            const params = { anio };
            if (mes) params.mes = mes;

            const response = await api.get("/presupuestos", { params });

            setPresupuestos(response.data ?? []);
            setGastosReales(response.gastos_reales ?? {});
            return response;

        } catch (err) {
            console.error("❌ Error en getPresupuestos:", err);
            setError(err.message);
            setPresupuestos([]);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Crear un nuevo presupuesto
     * @param {Object} body
     * @param {number} body.anio
     * @param {number|null} body.mes
     * @param {string} body.categoria
     * @param {string|null} body.descripcion
     * @param {number} body.monto_planificado
     */
    const createPresupuesto = useCallback(async (body) => {
        try {
            if (!body.categoria) throw new Error("categoria es requerida");
            if (!body.monto_planificado) throw new Error("monto_planificado es requerido");

            setLoading(true);
            setError(null);

            const response = await api.post("/presupuestos", {
                ...body,
                mes: body.mes ?? null,
                monto_planificado: Number(body.monto_planificado),
            });

            return response;

        } catch (err) {
            console.error("❌ Error en createPresupuesto:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Actualizar un presupuesto existente
     * @param {number} id
     * @param {Object} body - campos a actualizar
     */
    const updatePresupuesto = useCallback(async (id, body) => {
        try {
            if (!id) throw new Error("id es requerido");

            setLoading(true);
            setError(null);

            const response = await api.put(`/presupuestos/${id}`, body);
            return response;

        } catch (err) {
            console.error("❌ Error en updatePresupuesto:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Eliminar un presupuesto
     * @param {number} id
     */
    const deletePresupuesto = useCallback(async (id) => {
        try {
            if (!id) throw new Error("id es requerido");

            setLoading(true);
            setError(null);

            const response = await api.delete(`/presupuestos/${id}`);
            return response;

        } catch (err) {
            console.error("❌ Error en deletePresupuesto:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    return {
        loading,
        error,
        presupuestos,
        gastosReales,
        getPresupuestos,
        createPresupuesto,
        updatePresupuesto,
        deletePresupuesto,
    };
};