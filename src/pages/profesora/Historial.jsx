import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import { useEventos } from "../../hook/useEventos";
import {
  EVENTO_ESTADO,
  EVENTO_TIPO_LABEL,
  EVENTO_PADRE_ESTADO_LABEL,
} from "../../constants/estados";
import useApi from "../../hook/useApi";

const ESTADO_COLORS = {
  0: "bg-yellow-50 text-yellow-700",
  1: "bg-emerald-50 text-emerald-700",
  2: "bg-red-50 text-red-500",
  3: "bg-purple-50 text-purple-600",
  4: "bg-stone-100 text-stone-400",
};

const TIPO_COLORS = {
  0: "bg-amber-50 text-amber-700",
  1: "bg-orange-50 text-orange-600",
  2: "bg-blue-50 text-blue-600",
  3: "bg-emerald-50 text-emerald-700",
  4: "bg-purple-50 text-purple-600",
};

export default function Historial() {
  const [selected, setSelected] = useState(null);
  const { loading, error, eventos, getEventos } = useEventos();

  useEffect(() => {
    getEventos();
  }, []);

  // Mostrar todos — activos primero, luego cerrados
  const ordenados = [...eventos].sort((a, b) => {
    if (a.estado === EVENTO_ESTADO.ACTIVO && b.estado !== EVENTO_ESTADO.ACTIVO)
      return -1;
    if (a.estado !== EVENTO_ESTADO.ACTIVO && b.estado === EVENTO_ESTADO.ACTIVO)
      return 1;
    return new Date(b.fecha_inicio) - new Date(a.fecha_inicio);
  });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-black text-stone-800">Historial</h1>
        <p className="text-sm text-stone-400">
          Asistencia registrada por evento
        </p>
      </div>

      {error && <ErrorBanner msg={error} />}

      <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="text-teal-400 animate-spin" />
          </div>
        ) : ordenados.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-10">
            Sin eventos registrados
          </p>
        ) : (
          ordenados.map((e) => (
            <div
              key={e.id}
              className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-stone-50 transition-colors"
              onClick={() => setSelected(e)}
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0 mt-0.5">
                <CalendarDays size={17} className="text-teal-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLORS[e.tipo]}`}
                  >
                    {EVENTO_TIPO_LABEL[e.tipo]}
                  </span>
                  {e.estado === EVENTO_ESTADO.CERRADO && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-400">
                      Cerrado
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-stone-700 truncate">
                  {e.titulo}
                </p>
                <p className="text-xs text-stone-400">
                  {formatFecha(e.fecha_inicio)}
                  {e.fecha_fin ? ` → ${formatFecha(e.fecha_fin)}` : ""}
                </p>
              </div>
              <ChevronRight
                size={15}
                className="text-stone-300 shrink-0 mt-1"
              />
            </div>
          ))
        )}
      </div>

      {selected && (
        <ModalDetalleAsistencia
          evento={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ── Modal detalle asistencia de un evento ─────────────────────────────────────
function ModalDetalleAsistencia({ evento, onClose }) {
  const [padres, setPadres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const api = useApi();

  useEffect(() => {
    api
      .get(`/eventos/${evento.id}/padres`)
      .then((r) => setPadres(Array.isArray(r) ? r : []))
      .catch(() => setError("Error al cargar asistencia"))
      .finally(() => setLoading(false));
  }, []);

  const presentes = padres.filter((ep) => ep.estado === 1).length;
  const ausentes = padres.filter((ep) => ep.estado === 2).length;
  const pendientes = padres.filter((ep) => ep.estado === 0).length;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <p className="font-black text-stone-800 text-sm truncate">
              {evento.titulo}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              {formatFecha(evento.fecha_inicio)}
            </p>
          </div>
          <button onClick={onClose}>
            <X size={18} className="text-stone-400 hover:text-stone-600" />
          </button>
        </div>

        {/* Resumen */}
        {!loading && padres.length > 0 && (
          <div className="grid grid-cols-3 gap-2 px-5 py-3 shrink-0 border-b border-stone-50">
            <div className="text-center">
              <p className="text-lg font-black text-emerald-600">{presentes}</p>
              <p className="text-[10px] text-stone-400 font-medium">
                Presentes
              </p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-red-500">{ausentes}</p>
              <p className="text-[10px] text-stone-400 font-medium">Ausentes</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black text-yellow-600">{pendientes}</p>
              <p className="text-[10px] text-stone-400 font-medium">
                Pendientes
              </p>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-50 px-2 py-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={22} className="text-teal-400 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-center text-red-400 text-sm py-8">{error}</p>
          ) : padres.length === 0 ? (
            <p className="text-center text-stone-400 text-sm py-8">
              Sin asistencia registrada
            </p>
          ) : (
            padres.map((ep) => (
              <div
                key={ep.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50"
              >
                <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-black text-teal-700">
                    {ep.padre?.nombre
                      ?.split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("") ?? "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-700 truncate">
                    {ep.padre?.nombre ?? "—"}
                  </p>
                  {ep.hora_marcado && (
                    <p className="text-xs text-stone-400">
                      {new Date(ep.hora_marcado).toLocaleTimeString("es-PE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ESTADO_COLORS[ep.estado]}`}
                >
                  {EVENTO_PADRE_ESTADO_LABEL[ep.estado]}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ msg }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
      <AlertCircle size={16} className="text-red-400 shrink-0" />
      <p className="text-sm text-red-500 font-medium">{msg}</p>
    </div>
  );
}

function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
