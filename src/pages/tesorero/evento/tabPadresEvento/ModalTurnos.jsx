import { useState } from "react";
import { Check, Clock, Loader2, RotateCcw, ShieldOff, UserMinus, X } from "lucide-react";
import { EVENTO_ESTADO } from "../../../../constants/estados";
import useApi from "@/hook/useApi";
import { formatFecha } from "../../../../utils/utility";
import ModalExonerar from "./ModalExonerar";
import ModalQuitarPadre from "./ModalQuitarPadre";

// Modal para marcar turnos (entrada/salida) de una guardia con turnos.
// Incluye acciones: exonerar, revertir exoneración y quitar padre.
export default function ModalTurnos({ ep, evento, onClose, onRefresh, onToast }) {
  const [loading,     setLoading]     = useState(null); // turnoNum en proceso (1 o 2)
  const [modalEx,     setModalEx]     = useState(false);
  const [revertiendo, setRevertiendo] = useState(false);
  const api = useApi();

  const revertirExoneracion = async () => {
    if (!window.confirm(`¿Revertir exoneración de ${ep.padre?.nombre ?? "este padre"}?`)) return;
    setRevertiendo(true);
    try {
      await api.put(`/evento-padres/${ep.id}/revertir-exoneracion`);
      onToast("Exoneración revertida");
      onRefresh();
    } catch (e) {
      onToast(e.message ?? "Error al revertir", "err");
    } finally {
      setRevertiendo(false);
    }
  };

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

        {/* Acciones — exonerar / revertir / quitar */}
        {evento.estado === EVENTO_ESTADO.ACTIVO && (
          <div className="flex gap-2 pt-1 border-t border-stone-100">
            {/* Exonerar — solo si no está exonerado */}
            {ep.estado !== 4 && (
              <button
                onClick={() => setModalEx(true)}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl
                  bg-purple-50 hover:bg-purple-100 border border-purple-100 text-xs font-bold text-purple-500 transition-colors"
              >
                <ShieldOff size={12} /> Exonerar
              </button>
            )}

            {/* Revertir exoneración — solo si está exonerado */}
            {ep.estado === 4 && (
              <button
                onClick={revertirExoneracion}
                disabled={revertiendo}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl
                  bg-amber-50 hover:bg-amber-100 border border-amber-100 text-xs font-bold text-amber-600 transition-colors disabled:opacity-60"
              >
                {revertiendo
                  ? <Loader2 size={12} className="animate-spin" />
                  : <><RotateCcw size={12} /> Revertir exoneración</>
                }
              </button>
            )}

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
