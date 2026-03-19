import { useCallback, useState } from "react";
import useApi from "./useApi";

export const useMultas = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [multas, setMultas] = useState([]);

    const api = useApi();

    /**
     * @param {Object} params
     * @param {number|null} params.estado    - 0 pendiente | 1 parcial | 2 pagado | 3 exonerado | 4 anulado
     * @param {number|null} params.padre_id
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
            setMultas(response ?? []);
            return response;

        } catch (err) {
            console.error("❌ Error en getMultas:", err);
            setError(err.message);
            setMultas([]);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    // ❌ pagarMulta() eliminado → usar registrarAbono({ tipo_deuda: "multa", ... })

    const exonerarMulta = useCallback(async (id, motivo_exoneracion) => {
        try {
            if (!id) throw new Error("id es requerido");
            if (!motivo_exoneracion) throw new Error("El motivo es requerido");

            setLoading(true);
            setError(null);

            return await api.post(`/multas/${id}/exonerar`, { motivo_exoneracion });

        } catch (err) {
            console.error("❌ Error en exonerarMulta:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    const anularMulta = useCallback(async (id, motivo) => {
        try {
            if (!id) throw new Error("id es requerido");

            setLoading(true);
            setError(null);

            return await api.post(`/multas/${id}/anular`, { motivo });

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
        exonerarMulta,
        anularMulta,
    };
};