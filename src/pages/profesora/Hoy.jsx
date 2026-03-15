import { useEffect, useState } from "react";
import {
  CalendarDays,
  Users,
  CheckCircle,
  Clock,
  Loader2,
  ChevronRight,
  X,
  AlertCircle,
} from "lucide-react";
import { useEventos } from "../../hook/useEventos";
import {
  EVENTO_ESTADO,
  EVENTO_TIPO_LABEL,
  EVENTO_PADRE_ESTADO,
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

export default function Hoy() {
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const { loading, error, eventos, getEventos } = useEventos();

  useEffect(() => {
    getEventos();
  }, []);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  // Filtrar eventos activos de hoy
  const hoy = new Date().toISOString().slice(0, 10);
  const eventosHoy = eventos.filter((e) => {
    if (e.estado === EVENTO_ESTADO.CERRADO) return false;
    const fechaInicio = e.fecha_inicio?.slice(0, 10);
    const fechaFin = e.fecha_fin?.slice(0, 10);
    if (fechaInicio > hoy) return false;
    if (fechaFin && fechaFin < hoy) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-5">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div>
        <h1 className="text-xl font-black text-stone-800">Eventos de hoy</h1>
        <p className="text-sm text-stone-400">
          {new Date().toLocaleDateString("es-PE", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {error && <ErrorBanner msg={error} />}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="text-teal-400 animate-spin" />
        </div>
      ) : eventosHoy.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 flex flex-col items-center py-12 gap-3">
          <CalendarDays size={36} className="text-stone-200" />
          <p className="text-stone-400 text-sm font-medium">
            Sin eventos activos hoy
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {eventosHoy.map((e) => (
            <div
              key={e.id}
              className="bg-white rounded-2xl border border-stone-100 px-4 py-4 cursor-pointer hover:border-teal-200 transition-colors"
              onClick={() => setSelected(e)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                  <CalendarDays size={18} className="text-teal-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLORS[e.tipo]}`}
                    >
                      {EVENTO_TIPO_LABEL[e.tipo]}
                    </span>
                    {e.tiene_multa && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-400">
                        Multa S/{e.multa_monto}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-stone-700">{e.titulo}</p>
                  {e.hora_inicio && (
                    <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
                      <Clock size={11} /> {e.hora_inicio} — {e.hora_fin}
                    </p>
                  )}
                </div>
                <ChevronRight
                  size={16}
                  className="text-stone-300 shrink-0 mt-1"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <ModalAsistencia
          evento={selected}
          fecha={hoy}
          onClose={() => setSelected(null)}
          onToast={showToast}
        />
      )}
    </div>
  );
}

// ── Modal lista de asistencia del evento ──────────────────────────────────────
function ModalAsistencia({ evento, fecha, onClose, onToast }) {
  const [padres, setPadres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cerrando, setCerrando] = useState(false);
  const api = useApi();

  useEffect(() => {
    api
      .get(`/eventos/${evento.id}/padres`)
      .then((r) => {
        // Filtrar por fecha si es guardia
        const lista = Array.isArray(r) ? r : [];
        const filtrado =
          evento.tipo === 0 ? lista.filter((ep) => ep.fecha === fecha) : lista;
        setPadres(filtrado);
      })
      .catch(() => onToast("Error al cargar asistencia", "err"))
      .finally(() => setLoading(false));
  }, []);

  const handleMarcar = async (padreId) => {
    try {
      await api.post(`/eventos/${evento.id}/asistencia`, {
        padre_id: padreId,
        fecha,
      });
      onToast("Asistencia registrada ✓");
      // Actualizar estado local
      setPadres((prev) =>
        prev.map((ep) =>
          ep.padre_id === padreId
            ? {
                ...ep,
                estado: EVENTO_PADRE_ESTADO.PRESENTE,
                hora_marcado: new Date().toISOString(),
              }
            : ep,
        ),
      );
    } catch (e) {
      onToast(e.message ?? "Error al registrar", "err");
    }
  };

  const handleCerrar = async () => {
    if (
      !confirm(
        `¿Cerrar el evento "${evento.titulo}"? Se generarán multas a los ausentes.`,
      )
    )
      return;
    setCerrando(true);
    try {
      await api.post(`/eventos/${evento.id}/cerrar`, { fecha });
      onToast("Evento cerrado y multas generadas");
      onClose();
    } catch (e) {
      onToast(e.message ?? "Error al cerrar", "err");
    } finally {
      setCerrando(false);
    }
  };

  const presentes = padres.filter(
    (ep) => ep.estado === EVENTO_PADRE_ESTADO.PRESENTE,
  ).length;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
          <div className="min-w-0 flex-1 pr-4">
            <p className="font-black text-stone-800 text-sm truncate">
              {evento.titulo}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              {presentes}/{padres.length} presentes
            </p>
          </div>
          <button onClick={onClose}>
            <X size={18} className="text-stone-400 hover:text-stone-600" />
          </button>
        </div>

        {/* Barra de progreso */}
        {padres.length > 0 && (
          <div className="px-5 pt-3 shrink-0">
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-400 rounded-full transition-all"
                style={{ width: `${(presentes / padres.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-50 px-2 py-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={22} className="text-teal-400 animate-spin" />
            </div>
          ) : padres.length === 0 ? (
            <p className="text-center text-stone-400 text-sm py-8">
              Sin padres asignados
            </p>
          ) : (
            padres.map((ep) => {
              const yaPresente = ep.estado === EVENTO_PADRE_ESTADO.PRESENTE;
              const exonerado =
                ep.estado === EVENTO_PADRE_ESTADO.EXONERADO ||
                ep.estado === EVENTO_PADRE_ESTADO.JUSTIFICADO;
              return (
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
                    <p className="text-xs text-stone-400">{ep.padre?.grado}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ESTADO_COLORS[ep.estado]}`}
                    >
                      {EVENTO_PADRE_ESTADO_LABEL[ep.estado]}
                    </span>
                    {!yaPresente && !exonerado && (
                      <button
                        onClick={() => handleMarcar(ep.padre_id)}
                        className="w-7 h-7 rounded-full bg-teal-50 hover:bg-teal-100 flex items-center justify-center transition-colors"
                        title="Marcar presente"
                      >
                        <CheckCircle size={15} className="text-teal-500" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer — cerrar evento */}
        <div className="px-5 py-4 border-t border-stone-100 shrink-0">
          <button
            onClick={handleCerrar}
            disabled={cerrando}
            className="w-full h-10 bg-stone-800 hover:bg-stone-900 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {cerrando ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              "Cerrar evento y registrar ausentes"
            )}
          </button>
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

function Toast({ msg, type }) {
  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg
      ${type === "err" ? "bg-red-500 text-white" : "bg-stone-800 text-white"}`}
    >
      {msg}
    </div>
  );
}
