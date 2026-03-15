import { useCallback, useState } from "react";
import useApi from "./useApi";

export const useResumen = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [resumen, setResumen] = useState(null);

    const api = useApi();

    /**
     * Obtener datos del dashboard principal
     * Responde: { caja, multas, eventos_activos, total_padres, ultimos_movimientos }
     */
    const getResumen = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get("/reportes/dashboard");

            setResumen(response.data ?? null);
            return response.data;

        } catch (err) {
            console.error("❌ Error en getResumen:", err);
            setError(err.message);
            setResumen(null);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    return {
        loading,
        error,
        resumen,
        getResumen,
    };
};