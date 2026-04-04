import { useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarCheck2,
  Clock,
  Loader2,
  ChevronLeft,
  AlertCircle,
  MapPin,
  Users,
  Search,
  X,
  Lock,
  ChevronDown,
} from "lucide-react";
import {
  EVENTO_TIPO,
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
  // Estado para guardias: lista completa de fechas
  const [fechasGuardia, setFechasGuardia] = useState([]);
  // Estado para otros eventos: lista plana de padres
  const [padres, setPadres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cerrando, setCerrando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [modalCerrar, setModalCerrar] = useState(false);
  const api = useApi();

  const esGuardia = e.tipo === 0;

  useEffect(() => {
    if (esGuardia) {
      api.get(`/eventos/${e.id}/fechas`)
        .then((r) => setFechasGuardia(Array.isArray(r) ? r : []))
        .catch(() => onToast("Error al cargar fechas", "err"))
        .finally(() => setLoading(false));
    } else {
      api.get(`/eventos/${e.id}/padres`)
        .then((r) => setPadres(Array.isArray(r) ? r : []))
        .catch(() => onToast("Error al cargar asistencia", "err"))
        .finally(() => setLoading(false));
    }
  }, []);


  const handleCerrar = async () => {
    setModalCerrar(false);
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

  const esCuota = e.tipo === EVENTO_TIPO.CUOTA;
  const activo = esActivo(e);

  // Para eventos no-guardia
  const presentes = padres.filter((ep) => ep.estado === EVENTO_PADRE_ESTADO.PRESENTE).length;
  const padresFiltrados = padres.filter((ep) =>
    ep.padre?.nombre?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-0 h-[calc(100dvh-11.5rem)] w-full overflow-hidden">

      {/* ══ ZONA ESTÁTICA ════════════════════════════════════════════════════ */}
      <div className="shrink-0 flex flex-col gap-4 pb-4">

        {/* Fila: volver + botón cerrar */}
        <div className="flex items-center justify-between">
          <button
            onClick={onVolver}
            className="flex items-center gap-1.5 text-sm font-bold text-stone-400 hover:text-stone-700 transition-colors"
          >
            <ChevronLeft size={16} /> Volver a eventos
          </button>

          {activo && !esCuota && e.fecha_fin && e.fecha_fin.slice(0, 10) <= fecha && (
            <button
              onClick={() => setModalCerrar(true)}
              disabled={cerrando}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-stone-800 hover:bg-stone-900 text-white rounded-xl transition-colors disabled:opacity-60"
            >
              {cerrando
                ? <Loader2 size={13} className="animate-spin" />
                : <><Lock size={13} /> Cerrar evento</>}
            </button>
          )}
        </div>

        {/* Tarjeta de info del evento */}
        <div className="bg-white rounded-2xl border border-stone-100 px-5 py-5 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
              <CalendarDays size={22} className="text-teal-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap gap-2 mb-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLORS[e.tipo]}`}>
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
                {e.tiene_multa ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-100">
                    <AlertCircle size={9} /> S/ {parseFloat(e.multa_monto).toFixed(2)}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-400">
                    <AlertCircle size={9} /> Sin multa
                  </span>
                )}
              </div>
              <h2 className="text-base font-black text-stone-800 leading-tight">{e.titulo}</h2>
              {e.descripcion && <p className="text-sm text-stone-400 mt-1">{e.descripcion}</p>}
            </div>
          </div>

          <div className="border-t border-dashed border-stone-100" />

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <MetaItem icon={<CalendarDays size={13} className="text-stone-300" />} label="Fecha inicio" value={formatFecha(e.fecha_inicio)} />
            <MetaItem
              icon={<CalendarCheck2 size={13} className="text-stone-300" />}
              label="Fecha fin"
              value={mismaFecha(e.fecha_inicio, e.fecha_fin) ? "Mismo día" : formatFecha(e.fecha_fin)}
            />
            <MetaItem
              icon={<Clock size={13} className="text-stone-300" />}
              label="Hora"
              value={e.hora_inicio ? `${e.hora_inicio}${e.hora_fin ? ` — ${e.hora_fin}` : ""}` : "Sin hora definida"}
              muted={!e.hora_inicio}
            />
            {e.lugar && <MetaItem icon={<MapPin size={13} className="text-stone-300" />} label="Lugar" value={e.lugar} />}
          </div>
        </div>

        {/* Header de asistencia — solo para no-guardia */}
        {!esGuardia && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={14} className="text-stone-400" />
                <span className="text-xs font-black text-stone-500 uppercase tracking-widest">
                  {esCuota ? "Estado de pagos" : "Asistencia"}
                </span>
              </div>
              {!loading && padres.length > 0 && (
                <span className="text-xs font-bold text-stone-400">
                  {presentes} / {padres.length} {esCuota ? "pagados" : "presentes"}
                </span>
              )}
            </div>
            {!loading && padres.length > 0 && (
              <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${(presentes / padres.length) * 100}%` }}
                />
              </div>
            )}
            {!loading && padres.length > 0 && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar padre..."
                  value={busqueda}
                  onChange={(ev) => setBusqueda(ev.target.value)}
                  className="w-full h-9 pl-8 pr-8 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 placeholder-stone-300 focus:outline-none focus:border-teal-300 transition-colors"
                />
                {busqueda && (
                  <button onClick={() => setBusqueda("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500">
                    <X size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Header guardia */}
        {esGuardia && !loading && (
          <div className="flex items-center gap-2">
            <CalendarDays size={14} className="text-stone-400" />
            <span className="text-xs font-black text-stone-500 uppercase tracking-widest">
              Fechas de guardia
            </span>
            <span className="text-xs font-bold text-stone-400 ml-auto">
              {fechasGuardia.filter(f => f.completo).length}/{fechasGuardia.length} completas
            </span>
          </div>
        )}
      </div>

      {/* ══ ZONA SCROLLEABLE ═════════════════════════════════════════════════ */}
      <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-x-hidden">

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={22} className="text-teal-400 animate-spin" />
          </div>

        ) : esGuardia ? (
          /* Vista guardia: lista de fechas con acordeón */
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col gap-2 pb-1">
            {fechasGuardia.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2 bg-white rounded-2xl border border-stone-100">
                <CalendarDays size={28} className="text-stone-200" />
                <p className="text-sm text-stone-300 font-medium">Sin fechas generadas</p>
              </div>
            ) : (
              fechasGuardia.map((f) => (
                <FechaGuardiaCard
                  key={f.fecha}
                  f={f}
                  hoy={fecha}
                  activo={activo}
                  padresPorDia={e.padres_por_dia}
                />
              ))
            )}
          </div>

        ) : (
          /* Vista normal: lista plana */
          <div className="flex-1 min-h-0 bg-white rounded-2xl border border-stone-100 overflow-hidden overflow-y-auto">
            {padres.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <Users size={28} className="text-stone-200" />
                <p className="text-sm text-stone-300 font-medium">Sin padres asignados</p>
              </div>
            ) : padresFiltrados.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <Search size={24} className="text-stone-200" />
                <p className="text-sm text-stone-300 font-medium">Sin resultados para "{busqueda}"</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-50">
                {padresFiltrados.map((ep) => (
                  <FilaPadre
                    key={ep.id}
                    ep={ep}
                    esCuota={esCuota}
                    activo={activo}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal confirmación cerrar evento */}
      {modalCerrar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center shrink-0">
                <Lock size={18} className="text-stone-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-stone-800">¿Cerrar el evento?</p>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  <span className="font-semibold text-stone-700">{e.titulo}</span>
                  {e.tiene_multa
                    ? <> — Los padres ausentes recibirán una multa de <span className="font-bold text-red-500">S/ {parseFloat(e.multa_monto).toFixed(2)}</span>.</>
                    : " — Este evento no genera multa. Los ausentes quedarán registrados."
                  }
                </p>
              </div>
            </div>
            {e.tiene_multa && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                <AlertCircle size={13} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-500 font-medium">Esta acción no se puede deshacer</p>
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={() => setModalCerrar(false)} className="flex-1 h-10 bg-stone-100 hover:bg-stone-200 text-stone-700 text-sm font-bold rounded-xl transition-colors">
                Cancelar
              </button>
              <button onClick={handleCerrar} className="flex-1 h-10 bg-stone-800 hover:bg-stone-900 text-white text-sm font-bold rounded-xl transition-colors">
                Sí, cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tarjeta de fecha de guardia (acordeón) ────────────────────────────────────
function FechaGuardiaCard({ f, hoy, padresPorDia }) {
  const esHoy    = f.fecha === hoy;
  const esPasado = f.fecha < hoy;
  const esFuturo = f.fecha > hoy;

  // Abrir automáticamente si es hoy o la próxima fecha
  const [abierto, setAbierto] = useState(esHoy);

  const ocupados = (f.padres ?? []).filter((ep) => ![3, 4].includes(ep.estado)).length;
  const pct = Math.min(100, Math.round((ocupados / padresPorDia) * 100));

  const cardBorder = esHoy
    ? "border-teal-200 bg-teal-50/40"
    : esFuturo
      ? "border-blue-100 bg-blue-50/20"
      : "border-stone-100 bg-stone-50/50";

  const barColor = pct === 100
    ? esHoy ? "bg-teal-400" : esFuturo ? "bg-blue-400" : "bg-stone-300"
    : esHoy ? "bg-amber-400" : esFuturo ? "bg-blue-300" : "bg-stone-200";

  return (
    <div className={`rounded-2xl border overflow-hidden ${cardBorder}`}>
      {/* Barra de progreso */}
      <div className="h-1 bg-white/60 mx-3 mt-3 rounded-full">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>

      {/* Cabecera clickeable */}
      <button
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center gap-3 px-3 pt-2 pb-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-black ${esHoy ? "text-teal-700" : esFuturo ? "text-blue-700" : "text-stone-500"}`}>
              {formatFecha(f.fecha)}
            </span>
            {esHoy && (
              <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 border border-teal-200">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse inline-block" />
                Hoy
              </span>
            )}
            {esFuturo && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100">
                Próximo
              </span>
            )}
            {esPasado && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-400">
                Pasado
              </span>
            )}
          </div>
        </div>

        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
          ${pct === 100
            ? esHoy ? "bg-teal-100 text-teal-700" : esFuturo ? "bg-blue-100 text-blue-700" : "bg-stone-100 text-stone-500"
            : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
          {ocupados}/{padresPorDia}{pct === 100 ? " ✓" : ""}
        </span>

        <div className={`w-6 h-6 flex items-center justify-center rounded-full shrink-0 transition-transform duration-200 ${abierto ? "rotate-180" : ""} ${esHoy ? "bg-teal-100" : "bg-white/80"}`}>
          <ChevronDown size={13} className={esHoy ? "text-teal-600" : "text-stone-400"} />
        </div>
      </button>

      {/* Contenido expandido */}
      {abierto && (
        <div className="border-t border-white/60 divide-y divide-white/60">
          {(f.padres ?? []).length === 0 ? (
            <p className="text-[11px] text-stone-300 text-center py-3">Sin padres asignados</p>
          ) : (
            (f.padres ?? []).map((ep) => {
              const yaPresente = ep.estado === EVENTO_PADRE_ESTADO.PRESENTE;
              return (
                <div key={ep.id} className="flex items-center gap-3 px-3 py-2.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${yaPresente ? "bg-teal-100" : "bg-white/80"}`}>
                    <span className={`text-[10px] font-black ${yaPresente ? "text-teal-700" : "text-stone-400"}`}>
                      {ep.padre?.nombre?.split(" ").slice(0, 2).map((w) => w[0]).join("") ?? "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-xs font-semibold text-stone-700 line-clamp-1 wrap-break-word">
                      {ep.padre?.nombre ?? "—"}
                    </p>
                    {ep.padre?.grado && <p className="text-[10px] text-stone-400">{ep.padre.grado}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${ESTADO_COLORS[ep.estado]}`}>
                      {EVENTO_PADRE_ESTADO_LABEL[ep.estado]}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ── Fila de padre para eventos normales ───────────────────────────────────────
function FilaPadre({ ep, esCuota }) {
  const yaPresente = ep.estado === EVENTO_PADRE_ESTADO.PRESENTE;
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${yaPresente ? "bg-teal-100" : "bg-stone-100"}`}>
        <span className={`text-xs font-black ${yaPresente ? "text-teal-700" : "text-stone-400"}`}>
          {ep.padre?.nombre?.split(" ").slice(0, 2).map((w) => w[0]).join("") ?? "?"}
        </span>
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="text-sm font-semibold text-stone-700 line-clamp-2 wrap-break-word">{ep.padre?.nombre ?? "—"}</p>
        {ep.padre?.grado && <p className="text-xs text-stone-400">{ep.padre.grado}</p>}
      </div>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ESTADO_COLORS[ep.estado]}`}>
        {esCuota && yaPresente ? "Pagado" : EVENTO_PADRE_ESTADO_LABEL[ep.estado]}
      </span>
    </div>
  );
}
