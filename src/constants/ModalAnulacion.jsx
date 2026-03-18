// components/ModalAnulacion.jsx
import { useState } from "react";
import {
  X,
  AlertTriangle,
  RotateCcw,
  HeartHandshake,
  Loader2,
} from "lucide-react";
import useApi from "@/hook/useApi"; // ajusta la ruta según tu proyecto

export default function ModalAnulacion({ pago, onClose, onSuccess }) {
  const [motivo, setMotivo] = useState("");
  const [decision, setDecision] = useState(null); // "cobrar" | "perdonar"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const api = useApi();

  if (!pago) return null;

  const handleAnular = async () => {
    if (!motivo.trim()) {
      setError("El motivo es obligatorio.");
      return;
    }
    if (!decision) {
      setError("Debes elegir qué pasa con la deuda.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.post(`/pagos/${pago.id}/anular`, {
        motivo: motivo.trim(),
        perdonar_deuda: decision === "perdonar",
      });

      onSuccess(response.message);
      onClose();
    } catch (err) {
      setError(err.message ?? "Ocurrió un error al anular el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
              <AlertTriangle size={17} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-stone-800">Anular pago</p>
              <p className="text-xs text-stone-400">
                Esta acción queda registrada en auditoría
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          {/* Info del pago */}
          <div className="bg-stone-50 rounded-xl px-4 py-3 flex items-center justify-between border border-stone-100">
            <div>
              <p className="text-xs text-stone-400 font-medium">
                Padre / Madre
              </p>
              <p className="text-sm font-bold text-stone-700">
                {pago.padre_nombre}
              </p>
              <p className="text-xs text-stone-400">
                {pago.concepto ?? "Pago general"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-stone-400 font-medium">Monto</p>
              <p className="text-xl font-black text-stone-800">
                S/ {parseFloat(pago.monto).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Motivo */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-600">
              Motivo de anulación <span className="text-red-400">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setError("");
              }}
              placeholder="Ej: Pago duplicado, error de monto, padre incorrecto..."
              rows={2}
              className="w-full px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 resize-none outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Decisión */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-stone-600">
              ¿Qué pasa con la deuda del padre?{" "}
              <span className="text-red-400">*</span>
            </label>

            <button
              onClick={() => {
                setDecision("cobrar");
                setError("");
              }}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                ${decision === "cobrar" ? "border-orange-400 bg-orange-50" : "border-stone-200 bg-stone-50 hover:border-orange-200"}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${decision === "cobrar" ? "bg-orange-100" : "bg-stone-100"}`}
              >
                <RotateCcw
                  size={15}
                  className={
                    decision === "cobrar" ? "text-orange-500" : "text-stone-400"
                  }
                />
              </div>
              <div>
                <p
                  className={`text-sm font-bold ${decision === "cobrar" ? "text-orange-700" : "text-stone-600"}`}
                >
                  Volver a cobrar
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  La deuda queda pendiente. El padre sigue debiendo y se puede
                  registrar un nuevo pago cuando corresponda.
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                setDecision("perdonar");
                setError("");
              }}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                ${decision === "perdonar" ? "border-emerald-400 bg-emerald-50" : "border-stone-200 bg-stone-50 hover:border-emerald-200"}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${decision === "perdonar" ? "bg-emerald-100" : "bg-stone-100"}`}
              >
                <HeartHandshake
                  size={15}
                  className={
                    decision === "perdonar"
                      ? "text-emerald-500"
                      : "text-stone-400"
                  }
                />
              </div>
              <div>
                <p
                  className={`text-sm font-bold ${decision === "perdonar" ? "text-emerald-700" : "text-stone-600"}`}
                >
                  Perdonar la deuda
                </p>
                <p className="text-xs text-stone-400 mt-0.5">
                  La deuda queda cancelada sin cobro. No volverá a aparecer como
                  pendiente en el estado del padre.
                </p>
              </div>
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-5 pb-5">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-10 rounded-xl border border-stone-200 text-sm font-semibold text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleAnular}
            disabled={loading}
            className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Anulando...
              </>
            ) : (
              "Confirmar anulación"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Uso en el listado de pagos ───────────────────────────────────────────────
//
// import ModalAnulacion from "@/components/ModalAnulacion";
//
// const [pagoAAnular, setPagoAAnular] = useState(null);
//
// {pago.estado === 1 && (
//   <button onClick={() => setPagoAAnular(pago)}>Anular</button>
// )}
//
// <ModalAnulacion
//   pago={pagoAAnular}
//   onClose={() => setPagoAAnular(null)}
//   onSuccess={(msg) => { showToast(msg); fetchPagos(); }}
// />
