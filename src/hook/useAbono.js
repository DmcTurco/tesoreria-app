// hooks/useAbono.js
import { useCallback, useState } from "react";
import useApi from "./useApi";

export const useAbono = () => {
    const [loading, setLoading] = useState(false);
    const [loadingPend, setLoadingPend] = useState(false);
    const [error, setError] = useState(null);
    const [pendientes, setPendientes] = useState([]);

    const api = useApi();

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

            // ── Multas pendientes o parciales ─────────────────────────────────────
            for (const multa of (respuesta.multas ?? []).filter( (m) => m.estado === 0 || m.estado === 1 )) {
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

            // ── Cobros de eventos pendientes o parciales ──────────────────────────
            for (const cobro of (respuesta.cobros ?? []).filter( (c) => c.estado === 0 || c.estado === 1 )) {
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
     * Registrar un abono a una deuda (multa o cobro)
     * @param {Object} datos
     * @param {number} datos.padre_id
     * @param {string} datos.tipo_deuda  - "multa" | "cobro" | "cuota"
     * @param {number} datos.deuda_id
     * @param {number} datos.monto
     * @param {string} datos.fecha       - "YYYY-MM-DD"
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

            const response = await api.post("/abonos", {
                padre_id,
                tipo_deuda,
                deuda_id,
                monto,
                fecha,
            });

            return response;

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
     * @param {number} id
     * @param {string} motivo
     * @param {boolean} perdonar_deuda
     */
    const anularAbono = useCallback(async (id, motivo, perdonar_deuda = false) => {
        try {
            if (!id) throw new Error("id es requerido");
            if (!motivo) throw new Error("El motivo es requerido");

            setLoading(true);
            setError(null);

            const response = await api.post(`/abonos/${id}/anular`, {
                motivo,
                perdonar_deuda,
            });

            return response;

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
        pendientes,
        getPendientes,
        registrarAbono,
        anularAbono,
    };
};