import { EVENTO_ESTADO } from "../../../constants/estados";
import { today } from "@/utils/utility";

export const hoy = today();

export const ESTADO_COLORS = {
    0: "bg-yellow-50 text-yellow-700",
    1: "bg-emerald-50 text-emerald-700",
    2: "bg-red-50 text-red-500",
    3: "bg-purple-50 text-purple-600",
    4: "bg-stone-100 text-stone-400",
};

export const TIPO_COLORS = {
    0: "bg-amber-50 text-amber-700",
    1: "bg-orange-50 text-orange-600",
    2: "bg-blue-50 text-blue-600",
    3: "bg-emerald-50 text-emerald-700",
    4: "bg-purple-50 text-purple-600",
};

export function esActivo(e) {
    if (e.estado === EVENTO_ESTADO.CERRADO) return false;
    const ini = e.fecha_inicio?.slice(0, 10);
    const fin = e.fecha_fin?.slice(0, 10);
    if (ini > hoy) return false;
    if (fin && fin < hoy) return false;
    return true;
}

export function esPasado(e) {
    if (e.estado === EVENTO_ESTADO.CERRADO) return true;
    const fin = e.fecha_fin?.slice(0, 10);
    return fin ? fin < hoy : false;
}

export function esProximo(e) {
    return e.fecha_inicio?.slice(0, 10) > hoy;
}

// Las fechas vienen como UTC "2026-03-20T05:00:00.000000Z"
// Tomamos solo el slice YYYY-MM-DD para evitar desfase de zona horaria
export function formatFecha(fechaISO) {
    if (!fechaISO) return "—";
    const [y, m, d] = fechaISO.slice(0, 10).split("-");
    return new Date(+y, +m - 1, +d).toLocaleDateString("es-PE", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export function mismaFecha(a, b) {
    if (!a || !b) return false;
    return a.slice(0, 10) === b.slice(0, 10);
}