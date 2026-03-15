import { useCallback, useState } from "react";
import useApi from "./useApi";

export const usePagos = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagos, setPagos] = useState([]);

    const api = useApi();

    /**
     * Obtener pagos con filtros opcionales
     * @param {Object} params
     * @param {number|null} params.padre_id
     * @param {number|null} params.estado      - 0 pendiente | 1 pagado | 2 anulado
     * @param {string|null} params.fecha_inicio - YYYY-MM-DD
     * @param {string|null} params.fecha_fin    - YYYY-MM-DD
     */
    const getPagos = useCallback(async ({ padre_id = null, estado = null, fecha_inicio = null, fecha_fin = null } = {}) => {
        try {
            setLoading(true);
            setError(null);

            const params = {};
            if (padre_id !== null) params.padre_id = padre_id;
            if (estado !== null) params.estado = estado;
            if (fecha_inicio !== null) params.fecha_inicio = fecha_inicio;
            if (fecha_fin !== null) params.fecha_fin = fecha_fin;

            const response = await api.get("/pagos", { params });

            setPagos(response.data ?? []);
            return response.data;

        } catch (err) {
            console.error("❌ Error en getPagos:", err);
            setError(err.message);
            setPagos([]);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Registrar un pago — crea automáticamente un movimiento ingreso en el backend
     * @param {Object} body
     * @param {number}      body.padre_id
     * @param {string}      body.concepto
     * @param {number}      body.monto
     * @param {string}      body.fecha          - YYYY-MM-DD
     * @param {number|null} body.concepto_pago_id
     * @param {string|null} body.observaciones
     */
    const createPago = useCallback(async (body) => {
        try {
            if (!body.padre_id) throw new Error("padre_id es requerido");
            if (!body.concepto) throw new Error("concepto es requerido");
            if (!body.monto) throw new Error("monto es requerido");

            setLoading(true);
            setError(null);

            const response = await api.post("/pagos", body);
            return response;

        } catch (err) {
            console.error("❌ Error en createPago:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Anular un pago
     * @param {number}      id
     * @param {string|null} motivo
     */
    const anularPago = useCallback(async (id, motivo = null) => {
        try {
            if (!id) throw new Error("id es requerido");

            setLoading(true);
            setError(null);

            const body = motivo ? { motivo } : {};
            const response = await api.put(`/pagos/${id}/anular`, body);
            return response;

        } catch (err) {
            console.error("❌ Error en anularPago:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    return {
        loading,
        error,
        pagos,
        getPagos,
        createPago,
        anularPago,
    };
};