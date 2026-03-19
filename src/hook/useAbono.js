// hooks/useAbono.js
import { useCallback, useState } from "react";
import useApi from "./useApi";

export const useAbono = () => {
    const [loading, setLoading] = useState(false);
    const [loadingPend, setLoadingPend] = useState(false);
    const [error, setError] = useState(null);
    const [abonos, setAbonos] = useState([]);  // ← agregado
    const [pendientes, setPendientes] = useState([]);

    const api = useApi();

    /**
     * Listar abonos con filtros opcionales
     * @param {number|null} padre_id
     * @param {'multa'|'cobro'|null} tipo_deuda
     * @param {number|null} estado       - 0 activo | 1 anulado
     * @param {string|null} fecha_inicio - YYYY-MM-DD
     * @param {string|null} fecha_fin    - YYYY-MM-DD
     */
    const getAbonos = useCallback(async ({  // ← agregado
        padre_id = null,
        tipo_deuda = null,
        estado = null,
        fecha_inicio = null,
        fecha_fin = null,
    } = {}) => {
        try {
            setLoading(true);
            setError(null);

            const params = {};
            if (padre_id !== null) params.padre_id = padre_id;
            if (tipo_deuda !== null) params.tipo_deuda = tipo_deuda;
            if (estado !== null) params.estado = estado;
            if (fecha_inicio !== null) params.fecha_inicio = fecha_inicio;
            if (fecha_fin !== null) params.fecha_fin = fecha_fin;

            const response = await api.get("/abonos", { params });
            setAbonos(response ?? []);
            return response ?? [];

        } catch (err) {
            console.error("❌ Error en getAbonos:", err);
            setError(err.message);
            setAbonos([]);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Cargar deudas pendientes de un padre (multas + cobros)
     * @param {number} padre_id
     */
    const getPendientes = useCallback(async (padre_id) => {
        try {
            if (!padre_id) throw new Error("padre_id es requerido");

            setLoadingPend(true);
            setError(null);

            const respuesta = await api.get("/mi-estado-tesorero", {
                params: { padre_id },
            });

            const deudas = [];

            // ── Multas pendientes o parciales ─────────────────────────────────
            for (const multa of (respuesta.multas ?? []).filter(
                (m) => Number(m.estado) === 0 || Number(m.estado) === 1
            )) {
                const saldo = Number(multa.monto) - Number(multa.monto_pagado ?? 0);
                if (saldo > 0) {
                    deudas.push({
                        tipo: "multa",
                        id: multa.id,
                        label: multa.concepto,
                        monto_total: Number(multa.monto),
                        monto_pagado: Number(multa.monto_pagado ?? 0),
                        saldo,
                    });
                }
            }

            // ── Cobros de eventos pendientes o parciales ──────────────────────
            for (const cobro of (respuesta.cobros ?? []).filter(
                (c) => Number(c.estado) === 0 || Number(c.estado) === 1
            )) {
                const monto_total = Number(cobro.evento?.multa_monto ?? 0);
                const monto_pagado = Number(cobro.monto_pagado ?? 0);
                const saldo = monto_total - monto_pagado;
                if (saldo > 0) {
                    deudas.push({
                        tipo: "cobro",
                        id: cobro.id,
                        label: cobro.evento?.titulo ?? "—",
                        monto_total,
                        monto_pagado,
                        saldo,
                    });
                }
            }

            setPendientes(deudas);
            return deudas;

        } catch (err) {
            console.error("❌ Error en getPendientes:", err);
            setError(err.message);
            setPendientes([]);
            throw err;
        } finally {
            setLoadingPend(false);
        }
    }, [api]);

    /**
     * Registrar un abono a una deuda (multa | cobro)
     * @param {number} datos.padre_id
     * @param {'multa'|'cobro'} datos.tipo_deuda
     * @param {number} datos.deuda_id
     * @param {number} datos.monto
     * @param {string} datos.fecha - YYYY-MM-DD
     */
    const registrarAbono = useCallback(async ({ padre_id, tipo_deuda, deuda_id, monto, fecha }) => {
        try {
            if (!padre_id) throw new Error("padre_id es requerido");
            if (!tipo_deuda) throw new Error("tipo_deuda es requerido");
            if (!deuda_id) throw new Error("deuda_id es requerido");
            if (!monto || monto <= 0) throw new Error("El monto debe ser mayor a 0");
            if (!fecha) throw new Error("La fecha es requerida");

            setLoading(true);
            setError(null);

            return await api.post("/abonos", { padre_id, tipo_deuda, deuda_id, monto, fecha });

        } catch (err) {
            console.error("❌ Error en registrarAbono:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    /**
     * Anular un abono registrado
     * @param {number}  id
     * @param {string}  motivo
     * @param {boolean} perdonar_deuda
     */
    const anularAbono = useCallback(async (id, motivo, perdonar_deuda = false) => {
        try {
            if (!id) throw new Error("id es requerido");
            if (!motivo) throw new Error("El motivo es requerido");

            setLoading(true);
            setError(null);

            return await api.post(`/abonos/${id}/anular`, { motivo, perdonar_deuda });

        } catch (err) {
            console.error("❌ Error en anularAbono:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [api]);

    return {
        loading,
        loadingPend,
        error,
        abonos,         // ← agregado
        pendientes,
        getAbonos,      // ← agregado
        getPendientes,
        registrarAbono,
        anularAbono,
    };
};