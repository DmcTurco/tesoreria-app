import { useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarCheck2,
  CheckCircle,
  Clock,
  Loader2,
  ChevronLeft,
  AlertCircle,
  MapPin,
  Users,
  Search,
  X,
} from "lucide-react";
import {
  EVENTO_TIPO_LABEL,
  EVENTO_PADRE_ESTADO,
  EVENTO_PADRE_ESTADO_LABEL,
} from "../../../constants/estados";
import useApi from "@/hook/useApi";
import {
  esActivo,
  esPasado,
  esProximo,
  formatFecha,
  mismaFecha,
  TIPO_COLORS,
  ESTADO_COLORS,
} from "./eventoHelpers";
import { MetaItem } from "./../../../utils/utility";

export default function DetalleEvento({ evento: e, fecha, onVolver, onToast }) {
  const [padres, setPadres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cerrando, setCerrando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const api = useApi();

  useEffect(() => { api.get(`/eventos/${e.id}/padres`)
      .then((r) => {
        const lista = Array.isArray(r) ? r : [];
        const filtrado = e.tipo === 0 ? lista.filter((ep) => ep.fecha?.slice(0, 10) === fecha) : lista;
        setPadres(filtrado);
      })
      .catch(() => onToast("Error al cargar asistencia", "err"))
      .finally(() => setLoading(false));
  }, []);

  const handleMarcar = async (padreId) => {
    try {
      await api.post(`/eventos/${e.id}/asistencia`, {
        padre_id: padreId,
        fecha,
      });
      onToast("Asistencia registrada ✓");
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
    } catch (err) {
      onToast(err.message ?? "Error al registrar", "err");
    }
  };

  const handleCerrar = async () => {
    if (
      !confirm(
        `¿Cerrar el evento "${e.titulo}"? Se generarán multas a los ausentes.`,
      )
    )
      return;
    setCerrando(true);
    try {
      await api.post(`/eventos/${e.id}/cerrar`, { fecha });
      onToast("Evento cerrado y multas generadas");
      onVolver();
    } catch (err) {
      onToast(err.message ?? "Error al cerrar", "err");
    } finally {
      setCerrando(false);
    }
  };

  const presentes = padres.filter(
    (ep) => ep.estado === EVENTO_PADRE_ESTADO.PRESENTE,
  ).length;
  const activo = esActivo(e);

  const padresFiltrados = padres.filter((ep) =>
    ep.padre?.nombre?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* ══ ZONA ESTÁTICA — no hace scroll ═══════════════════════════════════ */}
      <div className="flex flex-col gap-4 pb-4 shrink-0">
        {/* Botón volver */}
        <button
          onClick={onVolver}
          className="flex items-center gap-1.5 text-sm font-bold text-stone-400 hover:text-stone-700 transition-colors w-fit"
        >
          <ChevronLeft size={16} /> Volver a eventos
        </button>

        {/* Tarjeta de info del evento */}
        <div className="bg-white rounded-2xl border border-stone-100 px-5 py-5 flex flex-col gap-4">
          {/* Título y badges */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
              <CalendarDays size={22} className="text-teal-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-1.5">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLORS[e.tipo]}`}
                >
                  {EVENTO_TIPO_LABEL[e.tipo]}
                </span>
                {activo && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600">
                    En curso
                  </span>
                )}
                {esPasado(e) && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-400">
                    Finalizado
                  </span>
                )}
                {esProximo(e) && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-500">
                    Próximo
                  </span>
                )}
              </div>
              <h2 className="text-base font-black text-stone-800 leading-tight">
                {e.titulo}
              </h2>
              {e.descripcion && (
                <p className="text-sm text-stone-400 mt-1">{e.descripcion}</p>
              )}
            </div>
          </div>

          <div className="border-t border-dashed border-stone-100" />

          {/* Grid de metadatos */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <MetaItem
              icon={<CalendarDays size={13} className="text-stone-300" />}
              label="Fecha inicio"
              value={formatFecha(e.fecha_inicio)}
            />
            <MetaItem
              icon={<CalendarCheck2 size={13} className="text-stone-300" />}
              label="Fecha fin"
              value={
                mismaFecha(e.fecha_inicio, e.fecha_fin)
                  ? "Mismo día"
                  : formatFecha(e.fecha_fin)
              }
            />
            <MetaItem
              icon={<Clock size={13} className="text-stone-300" />}
              label="Hora"
              value={
                e.hora_inicio
                  ? `${e.hora_inicio}${e.hora_fin ? ` — ${e.hora_fin}` : ""}`
                  : "Sin hora definida"
              }
              muted={!e.hora_inicio}
            />
            {e.lugar && (
              <MetaItem
                icon={<MapPin size={13} className="text-stone-300" />}
                label="Lugar"
                value={e.lugar}
              />
            )}
          </div>

          {/* Bloque de multa */}
          <div
            className={`flex items-center gap-3 rounded-xl px-4 py-3
            ${e.tiene_multa ? "bg-red-50 border border-red-100" : "bg-stone-50 border border-stone-100"}`}
          >
            <AlertCircle
              size={14}
              className={
                e.tiene_multa
                  ? "text-red-400 shrink-0"
                  : "text-stone-300 shrink-0"
              }
            />
            {e.tiene_multa ? (
              <div>
                <p className="text-xs font-black text-red-500">
                  Multa por ausencia
                </p>
                <p className="text-sm font-bold text-red-600">
                  S/ {parseFloat(e.multa_monto).toFixed(2)}
                </p>
              </div>
            ) : (
              <p className="text-xs font-semibold text-stone-400">
                Este evento no genera multa
              </p>
            )}
          </div>
        </div>

        {/* Header de asistencia + progreso + buscador — también estático */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-stone-400" />
              <span className="text-xs font-black text-stone-500 uppercase tracking-widest">
                Asistencia
              </span>
            </div>
            {!loading && padres.length > 0 && (
              <span className="text-xs font-bold text-stone-400">
                {presentes} / {padres.length} presentes
              </span>
            )}
          </div>

          {/* Barra de progreso */}
          {!loading && padres.length > 0 && (
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${(presentes / padres.length) * 100}%` }}
              />
            </div>
          )}

          {/* Buscador */}
          {!loading && padres.length > 0 && (
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Buscar padre..."
                value={busqueda}
                onChange={(ev) => setBusqueda(ev.target.value)}
                className="w-full h-9 pl-8 pr-8 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 placeholder-stone-300 focus:outline-none focus:border-teal-300 transition-colors"
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ══ ZONA SCROLLEABLE — lista de padres ═══════════════════════════════ */}
      <div className="overflow-y-auto flex-1 flex flex-col gap-3 pb-4">
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={22} className="text-teal-400 animate-spin" />
            </div>
          ) : padres.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <Users size={28} className="text-stone-200" />
              <p className="text-sm text-stone-300 font-medium">
                Sin padres asignados
              </p>
            </div>
          ) : padresFiltrados.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <Search size={24} className="text-stone-200" />
              <p className="text-sm text-stone-300 font-medium">
                Sin resultados para "{busqueda}"
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-50">
              {padresFiltrados.map((ep) => {
                const yaPresente = ep.estado === EVENTO_PADRE_ESTADO.PRESENTE;
                const exonerado =
                  ep.estado === EVENTO_PADRE_ESTADO.EXONERADO ||
                  ep.estado === EVENTO_PADRE_ESTADO.JUSTIFICADO;
                return (
                  <div
                    key={ep.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
                      ${yaPresente ? "bg-teal-100" : "bg-stone-100"}`}
                    >
                      <span
                        className={`text-xs font-black ${yaPresente ? "text-teal-700" : "text-stone-400"}`}
                      >
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
                      {ep.padre?.grado && (
                        <p className="text-xs text-stone-400">
                          {ep.padre.grado}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ESTADO_COLORS[ep.estado]}`}
                      >
                        {EVENTO_PADRE_ESTADO_LABEL[ep.estado]}
                      </span>
                      {!yaPresente && !exonerado && activo && (
                        <button
                          onClick={() => handleMarcar(ep.padre_id)}
                          className="w-8 h-8 rounded-full bg-teal-50 hover:bg-teal-100 flex items-center justify-center transition-colors"
                          title="Marcar presente"
                        >
                          <CheckCircle size={16} className="text-teal-500" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Botón cerrar — solo si activo, al final del scroll */}
        {activo && e.fecha_fin && e.fecha_fin.slice(0, 10) <= fecha && (
          <button
            onClick={handleCerrar}
            disabled={cerrando}
            className="w-full h-11 bg-stone-800 hover:bg-stone-900 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shrink-0"
          >
            {cerrando ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              "Cerrar evento y registrar ausentes"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
