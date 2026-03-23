import { Info, UserPlus, CheckSquare } from "lucide-react";
import { EVENTO_TIPO_LABEL, EVENTO_ESTADO } from "../../../constants/estados";
import { formatFecha } from "@/utils/utility";

const TIPO_COLORS = {
  0: "bg-amber-50 text-amber-700",
  1: "bg-blue-50 text-blue-600",
  2: "bg-orange-50 text-orange-600",
  3: "bg-emerald-50 text-emerald-700",
  4: "bg-purple-50 text-purple-600",
};

const TIPO_ICON_COLOR = {
  0: { bg: "bg-amber-50", stroke: "#BA7517" },
  1: { bg: "bg-blue-50", stroke: "#185FA5" },
  2: { bg: "bg-orange-50", stroke: "#993C1D" },
  3: { bg: "bg-emerald-50", stroke: "#3B6D11" },
  4: { bg: "bg-purple-50", stroke: "#534AB7" },
};

function TipoIcon({ tipo, ...props }) {
  switch (tipo) {
    case 0:
      return (
        // Guardia
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...props} />
      );
    case 1:
      return (
        // Reunión
        <>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      );
    case 2:
      return (
        // Faena
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      );
    case 3:
      return (
        // Cuota
        <>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </>
      );
    case 4:
      return (
        // Actividad
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      );
    default:
      return null;
  }
}

export default function EventoCard({
  evento: e,
  onDetalle,
  onCerrar,
  onAsignar,
}) {
  const ic = TIPO_ICON_COLOR[e.tipo] ?? TIPO_ICON_COLOR[0];
  const activo = e.estado === EVENTO_ESTADO.ACTIVO;

  return (
    <div
      className={`bg-white rounded-2xl border border-stone-100 flex flex-col overflow-hidden transition-opacity
      ${!activo ? "opacity-60" : ""}`}
    >
      {/* Cuerpo */}
      <div className="flex items-start gap-3 px-4 pt-4 pb-3">
        <div
          className={`w-10 h-10 rounded-xl ${ic.bg} flex items-center justify-center shrink-0`}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke={ic.stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <TipoIcon tipo={e.tipo} />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLORS[e.tipo]}`}
            >
              {EVENTO_TIPO_LABEL[e.tipo]}
            </span>
            {!activo && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-400">
                Cerrado
              </span>
            )}
            {e.tiene_multa && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-400">
                Multa S/{e.multa_monto}
              </span>
            )}
          </div>

          <p className="text-sm font-bold text-stone-800 truncate">
            {e.titulo}
          </p>
          <p className="text-xs text-stone-400 mt-0.5">
            {formatFecha(e.fecha_inicio)}
            {e.fecha_fin
              ? ` → ${formatFecha(e.fecha_fin)}`
              : " · sin fecha límite"}
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex border-t border-stone-50 divide-x divide-stone-50">
        <button
          onClick={onDetalle}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold
            text-stone-500 hover:bg-stone-50 transition-colors"
        >
          <Info size={13} />
          Ver detalle
        </button>

        {activo && [0, 1, 4].includes(e.tipo) && (
          <button
            onClick={onAsignar}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold
              text-amber-600 hover:bg-amber-50 transition-colors"
          >
            <UserPlus size={13} />
            Asignar padres
          </button>
        )}

        {activo && e.tipo !== 3 && (
          <button
            onClick={onCerrar}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold
              text-orange-500 hover:bg-orange-50 transition-colors"
          >
            <CheckSquare size={13} />
            Cerrar evento
          </button>
        )}
      </div>
    </div>
  );
}
