import { useState } from "react";
import { Check, Loader2, UserMinus } from "lucide-react";
import { EVENTO_ESTADO } from "../../../../constants/estados";
import useApi from "@/hook/useApi";
import { ESTADO_CONFIG } from "./estadoConfig";
import ModalTurnos from "./ModalTurnos";
import ModalQuitarPadre from "./ModalQuitarPadre";

// Chip de padre con gestión.
// Con turnos_estado: abre ModalTurnos. Sin turnos: chip simple con acciones.
export default function PadreChipWrapper({ ep, evento, esTesorero, onRefresh, onToast }) {
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

  const estados         = ep.turnos_estado ?? [0, 0];
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

// Chip simple (sin turnos)
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
