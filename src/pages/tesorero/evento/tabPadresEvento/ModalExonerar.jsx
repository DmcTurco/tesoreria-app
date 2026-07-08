import { useState } from "react";
import { Loader2, ShieldOff, X } from "lucide-react";
import useApi from "@/hook/useApi";
import { formatFecha } from "../../../../utils/utility";

// Modal para exonerar a un padre (usa el endpoint unificado quitar-padre)
export default function ModalExonerar({ ep, evento, onClose, onDone, onError }) {
  const [motivo,  setMotivo]  = useState("");
  const [loading, setLoading] = useState(false);
  const api = useApi();

  const handleSave = async () => {
    if (!motivo.trim()) { onError("Ingresa el motivo", "err"); return; }
    setLoading(true);
    try {
      await api.put(`/eventos/${evento.id}/quitar-padre/${ep.padre_id}`, {
        tipo:   "exonerado",
        motivo: motivo,
        fecha:  ep.fecha,
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
