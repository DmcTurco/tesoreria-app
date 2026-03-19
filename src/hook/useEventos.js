import { useCallback, useState } from "react";
import useApi from "./useApi";

export const useEventos = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [eventos, setEventos] = useState([]);

    const api = useApi();

    /**
     * Obtener todos los eventos
     */
    const getEventos = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get("/eventos");
            setEventos(response ?? []);
            return response;

        } catch (err) {
            console.error("❌ Error en getEventos:", err);
            setError(err.message);
            setEventos([]);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Crear un evento
     * @param {Object} body
     * @param {string}      body.titulo
     * @param {string|null} body.descripcion
     * @param {number}      body.tipo          - 0 guardia | 1 faena | 2 reunion | 3 cobro | 4 actividad
     * @param {string}      body.fecha_inicio  - YYYY-MM-DD
     * @param {string|null} body.fecha_fin
     * @param {string|null} body.hora_inicio   - HH:mm
     * @param {string|null} body.hora_fin
     * @param {string|null} body.lugar
     * @param {boolean}     body.tiene_multa
     * @param {number}      body.multa_monto
     * @param {number|null} body.padres_por_dia - solo guardias
     * @param {Array|null}  body.dias_semana    - solo guardias [1..7]
     */
    const createEvento = useCallback(async (body) => {
        try {
            if (!body.titulo) throw new Error("El título es requerido");
            if (!body.fecha_inicio) throw new Error("La fecha de inicio es requerida");

            setLoading(true);
            setError(null);

            const response = await api.post("/eventos", body);
            return response;

        } catch (err) {
            console.error("❌ Error en createEvento:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Cerrar un evento — marca ausentes y genera multas si tiene_multa = true
     * @param {number}      id
     * @param {string|null} fecha - no usado actualmente, reservado
     */
    const cerrarEvento = useCallback(async (id, fecha = null) => {
        try {
            if (!id) throw new Error("id es requerido");

            setLoading(true);
            setError(null);

            const body = fecha ? { fecha } : {};
            const response = await api.post(`/eventos/${id}/cerrar`, body);
            return response;

        } catch (err) {
            console.error("❌ Error en cerrarEvento:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Exonerar a un padre de un evento específico
     * @param {number}      eventoId
     * @param {number}      padreId
     * @param {string}      motivo_exoneracion
     * @param {string|null} fecha - para guardias
     */
    const exonerarPadre = useCallback(async (eventoId, padreId, motivo_exoneracion, fecha = null) => {
        try {
            if (!eventoId) throw new Error("eventoId es requerido");
            if (!padreId) throw new Error("padreId es requerido");
            if (!motivo_exoneracion) throw new Error("El motivo es requerido");

            setLoading(true);
            setError(null);

            const body = { padre_id: padreId, motivo_exoneracion };
            if (fecha) body.fecha = fecha;

            const response = await api.post(`/eventos/${eventoId}/exonerar-padre`, body);
            return response;

        } catch (err) {
            console.error("❌ Error en exonerarPadre:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    return {
        loading,
        error,
        eventos,
        getEventos,
        createEvento,
        cerrarEvento,
        exonerarPadre,
    };
};