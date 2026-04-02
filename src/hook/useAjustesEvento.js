import { useCallback, useState } from "react";
import useApi from "./useApi";

export const useAjustesEvento = (eventoId) => {
	const api = useApi();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [ajustesPendientes, setAjustesPendientes] = useState(null);


	const getAjustes = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			const res = await api.get(`/eventos/${eventoId}/ajustes`); // ← eventoId existe ahora
			const lista = Array.isArray(res) ? res : [];               // ← res, no response

			if (lista.length > 0) {
				setAjustesPendientes({
					lista,
					con_devolucion: lista.filter(a => a.diferencia < 0).length,
					con_cobro_extra: lista.filter(a => a.diferencia > 0).length,
				});
			} else {
				setAjustesPendientes(null);
			}

			return lista;

		} catch (err) {
			console.error("❌ Error en getAjustes:", err);
			setError(err.message);
			setAjustesPendientes(null);
			throw err;
		} finally {
			setLoading(false);
		}
	}, [eventoId]); // ← dependencia correcta

	const limpiarAjustes = () => setAjustesPendientes(null);

	return {
		loading,
		error,
		ajustesPendientes,
		setAjustesPendientes,
		getAjustes,
		limpiarAjustes,
	};
};