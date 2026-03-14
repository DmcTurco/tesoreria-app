import { useCallback, useState } from "react";
import useApi from "./useApi";

export const useMultas = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [multas, setMultas] = useState([]);

    const api = useApi();

    /**
     * Obtener multas con filtros opcionales
     * @param {Object} params
     * @param {number|null} params.estado   - 0 pendiente | 1 pagado | 2 exonerado | 3 anulado
     * @param {number|null} params.padre_id - Filtrar por padre
     * @param {number|null} params.evento_id
     */
    const getMultas = useCallback(async ({ estado = null, padre_id = null, evento_id = null } = {}) => {
        try {
            setLoading(true);
            setError(null);

            const params = {};
            if (estado !== null) params.estado = estado;
            if (padre_id !== null) params.padre_id = padre_id;
            if (evento_id !== null) params.evento_id = evento_id;

            const response = await api.get("/multas", { params });

            setMultas(response.data ?? []);
            return response.data;

        } catch (err) {
            console.error("❌ Error en getMultas:", err);
            setError(err.message);
            setMultas([]);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Cobrar una multa — se registra automáticamente como ingreso en movimientos
     * @param {number} id
     */
    const pagarMulta = useCallback(async (id) => {
        try {
            if (!id) throw new Error("id es requerido");

            setLoading(true);
            setError(null);

            const response = await api.post(`/multas/${id}/pagar`);
            return response;

        } catch (err) {
            console.error("❌ Error en pagarMulta:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Exonerar una multa pendiente
     * @param {number} id
     * @param {string} motivo_exoneracion
     */
    const exonerarMulta = useCallback(async (id, motivo_exoneracion) => {
        try {
            if (!id) throw new Error("id es requerido");
            if (!motivo_exoneracion) throw new Error("El motivo es requerido");

            setLoading(true);
            setError(null);

            const response = await api.post(`/multas/${id}/exonerar`, { motivo_exoneracion });
            return response;

        } catch (err) {
            console.error("❌ Error en exonerarMulta:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Anular una multa
     * @param {number} id
     * @param {string} motivo
     */
    const anularMulta = useCallback(async (id, motivo) => {
        try {
            if (!id) throw new Error("id es requerido");

            setLoading(true);
            setError(null);

            const response = await api.post(`/multas/${id}/anular`, { motivo });
            return response;

        } catch (err) {
            console.error("❌ Error en anularMulta:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    return {
        loading,
        error,
        multas,
        getMultas,
        pagarMulta,
        exonerarMulta,
        anularMulta,
    };
};