import { useEffect, useState } from "react";
import {
  Loader2,
  X,
  Check,
  ShieldOff,
  FileText,
  Clock,
  UserMinus,
  CalendarCheck,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { EVENTO_ESTADO } from "../../../constants/estados";
import useApi from "@/hook/useApi";
import ModalQuitarPadre from "./tabPadresEvento/ModalQuitarPadre";
import { formatFecha, StatCard } from "../../../utils/utility";

// ── Entrada principal ─────────────────────────────────────────────────────────
export default function TabPadresEvento({ evento, onToast, esTesorero }) {
  if (evento.tipo === 0) {
    return <TabGuardiaPorFechas evento={evento} onToast={onToast} esTesorero={esTesorero} />;
  }
  return <TabPadresPlano evento={evento} onToast={onToast} esTesorero={esTesorero} />;
}

// ── Config de estados ─────────────────────────────────────────────────────────
const ESTADO_CONFIG = {
  0: { label: "Pendiente",   icon: Clock,     color: "text-stone-400",  bg: "bg-stone-50",   border: "border-stone-200"  },
  1: { label: "Presente",    icon: Check,     color: "text-emerald-500",bg: "bg-emerald-50", border: "border-emerald-200" },
  2: { label: "Ausente",     icon: X,         color: "text-red-400",    bg: "bg-red-50",     border: "border-red-200"    },
  3: { label: "Justificado", icon: FileText,  color: "text-purple-400", bg: "bg-purple-50",  border: "border-purple-200" },
  4: { label: "Exonerado",   icon: ShieldOff, color: "text-amber-400",  bg: "bg-amber-50",   border: "border-amber-200"  },
};

// ── Vista guardia: lista de fechas con padres ─────────────────────────────────
function TabGuardiaPorFechas({ evento, onToast, esTesorero }) {
  const [fechas,  setFechas]  = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  const cargar = () => {
    setLoading(true);
    api
      .get(`/eventos/${evento.id}/fechas`)
      .then((r) => setFechas(Array.isArray(r) ? r : []))
      .catch(() => onToast("Error al cargar fechas", "err"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  if (loading) return (
    <div className="flex justify-center py-10">
      <Loader2 size={22} className="text-amber-400 animate-spin" />
    </div>
  );

  if (fechas.length === 0) return (
    <div className="flex flex-col items-center gap-2 py-10 text-stone-300">
      <CalendarCheck size={32} strokeWidth={1.5} />
      <p className="text-sm font-medium">Sin fechas generadas</p>
    </div>
  );

  const totalCompletos   = fechas.filter((f) => f.completo).length;
  const totalIncompletos = fechas.length - totalCompletos;

  return (
    <>
      {/* Resumen global */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatCard value={fechas.length}      label="Fechas"     color="stone"   />
        <StatCard value={totalCompletos}     label="Completas"  color="emerald" />
        <StatCard value={totalIncompletos}   label="Pendientes" color="amber"   />
      </div>

      <p className="text-[11px] text-stone-400 mb-3 font-medium">
        {evento.padres_por_dia} padre(s) requerido(s) por día
      </p>

      <div className="flex flex-col gap-2">
        {fechas.map((f) => (
          <FechaCard
            key={f.fecha}
            f={f}
            evento={evento}
            esTesorero={esTesorero}
            onRefresh={cargar}
            onToast={onToast}
          />
        ))}
      </div>
    </>
  );
}

// ── Card de una fecha — solo lectura + gestión de padres ──────────────────────
function FechaCard({ f, evento, esTesorero, onRefresh, onToast }) {
  const ocupados  = (f.padres ?? []).filter((ep) => ![3, 4].includes(ep.estado)).length;
  const requerido = evento.padres_por_dia;
  const pct       = Math.min(100, Math.round((ocupados / requerido) * 100));

  const hoyDate   = new Date(); hoyDate.setHours(0, 0, 0, 0);
  const fechaDate = new Date(f.fecha + "T00:00:00");
  const esPasado  = fechaDate < hoyDate;
  const esHoy     = fechaDate.getTime() === hoyDate.getTime();
  const esFuturo  = fechaDate > hoyDate;

  const cardStyle = esPasado
    ? "bg-stone-50 border-stone-200"
    : esHoy
      ? "bg-emerald-50/60 border-emerald-200"
      : "bg-blue-50/40 border-blue-200";

  const barColor = pct === 100
    ? esPasado ? "bg-stone-400" : esHoy ? "bg-emerald-400" : "bg-blue-400"
    : esPasado ? "bg-stone-300" : esHoy ? "bg-amber-400"   : "bg-blue-300";

  const fechaTextColor = esPasado ? "text-stone-400" : esHoy ? "text-emerald-700" : "text-blue-700";

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${cardStyle}`}>
      {/* Barra progreso */}
      <div className="h-1 bg-stone-100/80 mx-3 mt-3 rounded-full">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="px-3 pt-2 pb-3">
        <div className="flex items-center justify-between mb-2.5">
          {/* Fecha + badge estado temporal */}
          <div className="flex items-center gap-2">
            <p className={`text-xs font-black ${fechaTextColor}`}>
              {formatFecha(f.fecha)}
            </p>
            {esHoy && (
              <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Hoy
              </span>
            )}
            {esPasado && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-400">
                Pasado
              </span>
            )}
            {esFuturo && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100">
                Próximo
              </span>
            )}
          </div>

          {/* Solo contador — sin botón asignar */}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
            ${pct === 100
              ? esPasado ? "bg-stone-100 text-stone-500" : esHoy ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
              : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {ocupados}/{requerido}
            {pct === 100 ? " ✓" : ` · falta ${f.faltante}`}
          </span>
        </div>

        {/* Chips de padres */}
        {(f.padres ?? []).length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {(f.padres ?? []).map((ep) => (
              <PadreChipWrapper
                key={ep.id}
                ep={ep}
                evento={evento}
                esTesorero={esTesorero}
                onRefresh={onRefresh}
                onToast={onToast}
              />
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-stone-300 italic">Sin padres asignados</p>
        )}
      </div>
    </div>
  );
}

// ── Chip de padre con gestión ─────────────────────────────────────────────────
// Con turnos_estado: abre ModalTurnos. Sin turnos: comportamiento original.
function PadreChipWrapper({ ep, evento, esTesorero, onRefresh, onToast }) {
  if (ep.turnos_estado != null) {
    return (
      <PadreChipConTurnos
        ep={ep}
        evento={evento}
        esTesorero={esTesorero}
        onRefresh={onRefresh}
        onToast={onToast}
      />
    );
  }

  return (
    <PadreChip
      ep={ep}
      evento={evento}
      esTesorero={esTesorero}
      onRefresh={onRefresh}
      onToast={onToast}
    />
  );
}

// Chip para padres con turnos (bapers)
function PadreChipConTurnos({ ep, evento, esTesorero, onRefresh, onToast }) {
  const [modalOpen, setModalOpen] = useState(false);

  const estados        = ep.turnos_estado ?? [0, 0];
  const entradaPresente = estados[0] === 1;
  const salidaPresente  = estados[1] === 1;
  const ambosPresentes  = entradaPresente && salidaPresente;
  const algunPresente   = entradaPresente || salidaPresente;

  const padre = ep.padre;

  const chipBg = ambosPresentes
    ? "bg-emerald-50 border-emerald-200"
    : algunPresente
      ? "bg-amber-50 border-amber-200"
      : "bg-stone-50 border-stone-200";

  return (
    <>
      <button
        onClick={() => esTesorero && setModalOpen(true)}
        className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 border transition-all cursor-pointer hover:opacity-80 ${chipBg}`}
      >
        <div className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-[8px] font-black text-stone-600">
            {padre?.nombre?.split(" ").slice(0, 2).map((w) => w[0]).join("") ?? "?"}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-stone-700 leading-none">
          {padre?.nombre?.split(" ").slice(0, 2).join(" ")}
        </span>
        {/* Indicadores E / S */}
        <div className="flex gap-0.5 ml-0.5">
          <span className={`text-[9px] font-black px-1 py-0.5 rounded
            ${entradaPresente ? "bg-emerald-400 text-white" : "bg-stone-200 text-stone-400"}`}>
            E
          </span>
          <span className={`text-[9px] font-black px-1 py-0.5 rounded
            ${salidaPresente ? "bg-emerald-400 text-white" : "bg-stone-200 text-stone-400"}`}>
            S
          </span>
        </div>
      </button>

      {modalOpen && (
        <ModalTurnos
          ep={ep}
          evento={evento}
          onClose={() => setModalOpen(false)}
          onRefresh={() => { onRefresh(); setModalOpen(false); }}
          onToast={onToast}
        />
      )}
    </>
  );
}

// Modal para marcar turnos individualmente
function ModalTurnos({ ep, evento, onClose, onRefresh, onToast }) {
  const [loading, setLoading] = useState(null); // turnoNum en proceso (1 o 2)
  const [modalEx, setModalEx] = useState(false);
  const api = useApi();

  const padre    = ep.padre;
  const fechaStr = ep.fecha ? String(ep.fecha).slice(0, 10) : null;
  const estados  = ep.turnos_estado ?? [0, 0];

  const montoPorTurno = Number(ep.monto_asignado ?? 0) / 2;

  const marcar = async (turnoNum) => {
    const idx = turnoNum === 1 ? 0 : 1;
    if (estados[idx] === 1) return;
    setLoading(turnoNum);
    try {
      await api.post(`/eventos/${evento.id}/asistencia`, {
        padre_id: ep.padre_id,
        fecha:    fechaStr,
        turno:    turnoNum,
      });
      onToast("Turno registrado");
      onRefresh();
    } catch (e) {
      onToast(e.message ?? "Error al registrar", "err");
    } finally {
      setLoading(null);
    }
  };

  const turnosData = [
    { label: "Entrada", turnoNum: 1, idx: 0 },
    { label: "Salida",  turnoNum: 2, idx: 1 },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-black text-amber-700">
                {padre?.nombre?.split(" ").slice(0, 2).map((w) => w[0]).join("") ?? "?"}
              </span>
            </div>
            <div>
              <p className="text-sm font-black text-stone-800">{padre?.nombre ?? "—"}</p>
              <p className="text-[10px] text-stone-400">
                {evento.titulo} · {fechaStr ? formatFecha(fechaStr) : "—"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center"
          >
            <X size={14} className="text-stone-500" />
          </button>
        </div>

        {/* Turnos */}
        <div className="flex flex-col gap-2">
          {turnosData.map(({ label, turnoNum, idx }) => {
            const presente = estados[idx] === 1;
            return (
              <div
                key={turnoNum}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all
                  ${presente ? "bg-emerald-50 border-emerald-200" : "bg-stone-50 border-stone-200"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                  ${presente ? "bg-emerald-100" : "bg-stone-100"}`}>
                  {presente
                    ? <Check size={14} className="text-emerald-600" strokeWidth={3} />
                    : <Clock size={14} className="text-stone-400" />
                  }
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${presente ? "text-emerald-700" : "text-stone-600"}`}>
                    Turno {label}
                  </p>
                  <p className="text-[10px] text-stone-400">
                    {presente
                      ? "Asistió"
                      : `Pendiente · multa S/ ${montoPorTurno.toFixed(2)}`}
                  </p>
                </div>
                {!presente && evento.estado === EVENTO_ESTADO.ACTIVO && (
                  <button
                    onClick={() => marcar(turnoNum)}
                    disabled={loading === turnoNum}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600
                      text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-60"
                  >
                    {loading === turnoNum
                      ? <Loader2 size={12} className="animate-spin" />
                      : <><Check size={12} strokeWidth={3} /> Marcar</>
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Acciones — exonerar / quitar */}
        {evento.estado === EVENTO_ESTADO.ACTIVO && (
          <div className="flex gap-2 pt-1 border-t border-stone-100">
            <button
              onClick={() => setModalEx(true)}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl
                bg-purple-50 hover:bg-purple-100 border border-purple-100 text-xs font-bold text-purple-500 transition-colors"
            >
              <ShieldOff size={12} /> Exonerar
            </button>
            <BotonQuitarPadre
              ep={ep}
              evento={evento}
              onDone={() => { onClose(); onRefresh(); onToast("Asignación eliminada"); }}
              onError={onToast}
            />
          </div>
        )}
      </div>

      {modalEx && (
        <ModalExonerar
          ep={{ ...ep, fecha: fechaStr }}
          evento={evento}
          onClose={() => setModalEx(false)}
          onDone={() => { setModalEx(false); onClose(); onRefresh(); onToast("Padre exonerado"); }}
          onError={onToast}
        />
      )}
    </div>
  );
}

// Botón quitar padre inline (para usar dentro de ModalTurnos)
function BotonQuitarPadre({ ep, evento, onDone, onError }) {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl
          bg-red-50 hover:bg-red-100 border border-red-100 text-xs font-bold text-red-400 transition-colors"
      >
        <UserMinus size={12} /> Quitar
      </button>
      {modalOpen && (
        <ModalQuitarPadre
          ep={ep}
          evento={evento}
          onClose={() => setModalOpen(false)}
          onDone={onDone}
          onError={onError}
        />
      )}
    </>
  );
}

function PadreChip({ ep, evento, esTesorero, onRefresh, onToast }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [marcando,  setMarcando]  = useState(false);
  const cfg  = ESTADO_CONFIG[ep.estado] ?? ESTADO_CONFIG[0];
  const Icon = cfg.icon;
  const api  = useApi();

  const marcarAsistencia = async (e) => {
    e.stopPropagation();
    setMarcando(true);
    try {
      await api.post(`/eventos/${evento.id}/asistencia`, {
        padre_id: ep.padre_id,
        fecha:    ep.fecha,
      });
      onToast("Asistencia registrada");
      onRefresh();
    } catch (err) {
      onToast(err.message ?? "Error al registrar asistencia", "err");
    } finally {
      setMarcando(false);
    }
  };

  return (
    <>
      <div className={`group flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 border transition-all ${cfg.bg} ${cfg.border}`}>
        <div className="w-5 h-5 rounded-full bg-white/80 flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-[8px] font-black text-stone-600">
            {ep.padre?.nombre?.split(" ").slice(0, 2).map((w) => w[0]).join("") ?? "?"}
          </span>
        </div>
        <span className="text-[11px] font-semibold text-stone-700 leading-none">
          {ep.padre?.nombre?.split(" ").slice(0, 2).join(" ")}
        </span>
        <Icon size={11} className={cfg.color} strokeWidth={2.5} title={cfg.label} />

        {/* Marcar asistencia — solo pendientes */}
        {esTesorero && evento.estado === EVENTO_ESTADO.ACTIVO && ep.estado === 0 && (
          <button
            onClick={marcarAsistencia}
            disabled={marcando}
            title="Marcar asistencia"
            className="w-4 h-4 rounded-full bg-white/60 hover:bg-emerald-50 border border-stone-200
              hover:border-emerald-200 flex items-center justify-center transition-all
              opacity-0 group-hover:opacity-100 ml-0.5"
          >
            {marcando
              ? <Loader2 size={8} className="text-emerald-400 animate-spin" strokeWidth={3} />
              : <Check size={8} className="text-emerald-500" strokeWidth={3} />
            }
          </button>
        )}

        {/* Quitar/gestionar — solo pendientes */}
        {esTesorero && evento.estado === EVENTO_ESTADO.ACTIVO && ep.estado === 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setModalOpen(true); }}
            title="Gestionar asignación"
            className="w-4 h-4 rounded-full bg-white/60 hover:bg-red-50 border border-stone-200
              hover:border-red-200 flex items-center justify-center transition-all
              opacity-0 group-hover:opacity-100 ml-0.5"
          >
            <UserMinus size={9} className="text-stone-400 hover:text-red-400" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {modalOpen && (
        <ModalQuitarPadre
          ep={ep}
          evento={evento}
          onClose={() => setModalOpen(false)}
          onDone={() => { setModalOpen(false); onRefresh(); onToast("Estado actualizado"); }}
          onError={onToast}
        />
      )}
    </>
  );
}

// ── Vista plana: faena, reunión, actividad ────────────────────────────────────
function TabPadresPlano({ evento, onToast, esTesorero }) {
  const [padres,     setPadres]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modalEx,    setModalEx]    = useState(null);
  const [marcando,   setMarcando]   = useState(null); // padre_id en proceso
  const api = useApi();

  const marcarAsistencia = async (ep) => {
    setMarcando(ep.padre_id);
    try {
      await api.post(`/eventos/${evento.id}/asistencia`, {
        padre_id: ep.padre_id,
        fecha:    ep.fecha ?? undefined,
      });
      onToast("Asistencia registrada");
      cargar();
    } catch (e) {
      onToast(e.message ?? "Error al registrar asistencia", "err");
    } finally {
      setMarcando(null);
    }
  };

  const cargar = () => {
    setLoading(true);
    api
      .get(`/eventos/${evento.id}/padres`)
      .then((r) => setPadres(Array.isArray(r) ? r : []))
      .catch(() => onToast("Error al cargar padres", "err"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const presentes  = padres.filter((ep) => ep.estado === 1).length;
  const ausentes   = padres.filter((ep) => ep.estado === 2).length;
  const pendientes = padres.filter((ep) => ep.estado === 0).length;

  return (
    <>
      {!loading && padres.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatCard value={presentes}  label="Presentes"  color="emerald" />
          <StatCard value={ausentes}   label="Ausentes"   color="red"     />
          <StatCard value={pendientes} label="Pendientes" color="amber"   />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={22} className="text-amber-400 animate-spin" />
        </div>
      ) : padres.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-stone-300">
          <AlertTriangle size={28} strokeWidth={1.5} />
          <p className="text-sm font-medium">Sin padres asignados</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {padres.map((ep) => {
            const cfg  = ESTADO_CONFIG[ep.estado] ?? ESTADO_CONFIG[0];
            const Icon = cfg.icon;
            return (
              <div
                key={ep.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50 transition-colors group"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-amber-700">
                    {ep.padre?.nombre?.split(" ").slice(0, 2).map((w) => w[0]).join("") ?? "?"}
                  </span>
                </div>

                {/* Nombre */}
                <p className="flex-1 text-xs font-semibold text-stone-700 truncate min-w-0">
                  {ep.padre?.nombre ?? "—"}
                </p>

                {/* Badge estado */}
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border shrink-0
                  ${cfg.bg} ${cfg.border} ${cfg.color}`}
                >
                  <Icon size={9} strokeWidth={2.5} />
                  {cfg.label}
                </span>

                {/* Botón marcar asistencia — solo pendientes */}
                {esTesorero && evento.estado === EVENTO_ESTADO.ACTIVO && ep.estado === 0 && (
                  <button
                    onClick={() => marcarAsistencia(ep)}
                    disabled={marcando === ep.padre_id}
                    title="Marcar asistencia"
                    className="w-7 h-7 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-100
                      flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {marcando === ep.padre_id
                      ? <Loader2 size={12} className="text-emerald-400 animate-spin" />
                      : <UserCheck size={12} className="text-emerald-500" />
                    }
                  </button>
                )}

                {/* Botón exonerar — solo tesorero, activo, pendiente o presente */}
                {esTesorero && evento.estado === EVENTO_ESTADO.ACTIVO && [0, 1].includes(ep.estado) && (
                  <button
                    onClick={() => setModalEx(ep)}
                    title="Exonerar"
                    className="w-7 h-7 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-100
                      flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <ShieldOff size={12} className="text-purple-400" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalEx && (
        <ModalExonerar
          ep={modalEx}
          evento={evento}
          onClose={() => setModalEx(null)}
          onDone={() => { setModalEx(null); cargar(); onToast("Padre exonerado"); }}
          onError={onToast}
        />
      )}
    </>
  );
}

// ── Modal exonerar padre ──────────────────────────────────────────────────────
function ModalExonerar({ ep, evento, onClose, onDone, onError }) {
  const [motivo,  setMotivo]  = useState("");
  const [loading, setLoading] = useState(false);
  const api = useApi();

  const handleSave = async () => {
    if (!motivo.trim()) { onError("Ingresa el motivo", "err"); return; }
    setLoading(true);
    try {
      await api.post(`/eventos/${evento.id}/exonerar-padre`, {
        padre_id:           ep.padre_id,
        motivo_exoneracion: motivo,
        fecha:              ep.fecha,
      });
      onDone();
    } catch (e) {
      onError(e.message ?? "Error al exonerar", "err");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
              <ShieldOff size={14} className="text-purple-500" />
            </div>
            <p className="font-black text-stone-800 text-sm">Exonerar padre</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center"
          >
            <X size={14} className="text-stone-500" />
          </button>
        </div>

        <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-black text-amber-700">
              {ep.padre?.nombre?.split(" ").slice(0, 2).map((w) => w[0]).join("") ?? "?"}
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-stone-700">{ep.padre?.nombre}</p>
            {ep.fecha && (
              <p className="text-[10px] text-stone-400">{formatFecha(ep.fecha)}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-stone-600">Motivo *</label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ej: Viaje de trabajo, emergencia familiar..."
            rows={3}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm
              text-stone-700 outline-none focus:border-purple-400 resize-none transition-colors"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading || !motivo.trim()}
          className="h-10 bg-purple-500 hover:bg-purple-600 text-white text-sm font-bold
            rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
        >
          {loading
            ? <Loader2 size={15} className="animate-spin" />
            : "Confirmar exoneración"
          }
        </button>
      </div>
    </div>
  );
}