import { useState } from "react";
import useApi from "@/hook/useApi";
import { Loader2, X, ShieldOff, FileText, Trash2 } from "lucide-react";
import { formatFecha } from "../../../../utils/utility";

export default function ModalQuitarPadre({
  ep,
  evento,
  onClose,
  onDone,
  onError,
}) {
  const [tipo, setTipo] = useState("exonerado");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const api = useApi();

  const TIPOS = [
    {
      val: "exonerado",
      label: "Exonerado",
      desc: "Imprevisto — no se generará multa.",
      icon: ShieldOff,
      active: "bg-amber-50 border-amber-400 text-amber-700",
      btn: "bg-amber-500 hover:bg-amber-600",
      dot: "bg-amber-400",
    },
    {
      val: "justificado",
      label: "Justificado",
      desc: "Con documento formal — no se generará multa.",
      icon: FileText,
      active: "bg-purple-50 border-purple-400 text-purple-700",
      btn: "bg-purple-500 hover:bg-purple-600",
      dot: "bg-purple-400",
    },
    {
      val: "error",
      label: "Error",
      desc: "Error de asignación — se eliminará el registro.",
      icon: Trash2,
      active: "bg-red-50 border-red-400 text-red-600",
      btn: "bg-red-500 hover:bg-red-600",
      dot: "bg-red-400",
    },
  ];

  const tipoActual = TIPOS.find((t) => t.val === tipo);

  const handleSave = async () => {
    if (tipo !== "error" && !motivo.trim()) {
      onError("Ingresa el motivo", "err");
      return;
    }
    setLoading(true);
    try {
      if (tipo === "error") {
        const fecha = ep.fecha
          ? typeof ep.fecha === "string"
            ? ep.fecha.slice(0, 10)
            : null
          : null;
        await api.delete(
          `/eventos/${evento.id}/quitar-padre/${ep.padre_id ?? ep.padre?.id}`,
          { params: { fecha } },
        );
      } else {
        await api.put(
          `/eventos/${evento.id}/quitar-padre/${ep.padre_id ?? ep.padre?.id}`,
          { tipo, motivo, fecha: ep.fecha },
        );
      }
      onDone();
    } catch (e) {
      onError(e.message ?? "Error al actualizar", "err");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="font-black text-stone-800 text-sm">Quitar de guardia</p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
          >
            <X size={14} className="text-stone-500" />
          </button>
        </div>

        {/* Padre */}
        <div className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-black text-amber-700">
              {ep.padre?.nombre
                ?.split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("") ?? "?"}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-stone-700 truncate">
              {ep.padre?.nombre}
            </p>
            {ep.fecha && (
              <p className="text-[10px] text-stone-400">
                {formatFecha(ep.fecha)}
              </p>
            )}
          </div>
        </div>

        {/* Selector de tipo */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-stone-500 uppercase tracking-wide">
            Motivo de retiro
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS.map(({ val, label, icon: Icon, active }) => (
              <button
                key={val}
                onClick={() => setTipo(val)}
                className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border-2 transition-all
                  ${tipo === val ? active : "bg-stone-50 border-stone-200 text-stone-400 hover:border-stone-300"}`}
              >
                <Icon size={16} strokeWidth={2} />
                <span className="text-[10px] font-bold leading-none">
                  {label}
                </span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-stone-400 px-0.5">{tipoActual.desc}</p>
        </div>

        {/* Motivo (oculto en error) */}
        {tipo !== "error" && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-stone-600">Motivo *</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder={
                tipo === "exonerado"
                  ? "Ej: Emergencia familiar, viaje imprevisto..."
                  : "Ej: Certificado médico presentado..."
              }
              rows={3}
              className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400 resize-none transition-colors"
            />
          </div>
        )}

        {/* Botón confirmar */}
        <button
          onClick={handleSave}
          disabled={loading || (tipo !== "error" && !motivo.trim())}
          className={`h-10 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50
            ${tipoActual.btn}`}
        >
          {loading ? (
            <Loader2 size={15} className="animate-spin" />
          ) : tipo === "error" ? (
            <>
              <Trash2 size={14} />
              Eliminar asignación
            </>
          ) : (
            `Confirmar como ${tipo}`
          )}
        </button>
      </div>
    </div>
  );
}

