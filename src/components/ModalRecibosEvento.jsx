import { useEffect, useState } from "react";
import { X, Loader2, ExternalLink, Receipt, TrendingDown } from "lucide-react";
import useApi from "../hook/useApi";
import { formatFecha } from "../utils/utility";

/**
 * Modal que lista los egresos/gastos de un evento con sus recibos.
 * Uso: <ModalRecibosEvento eventoId={e.id} titulo={e.titulo} onClose={() => ...} />
 */
export default function ModalRecibosEvento({ eventoId, titulo, onClose }) {
  const [gastos,  setGastos]  = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    api.get(`/eventos/${eventoId}/gastos`)
      .then((res) => setGastos(Array.isArray(res) ? res : []))
      .catch(() => setGastos([]))
      .finally(() => setLoading(false));
  }, [eventoId]);

  const total = gastos.reduce((s, g) => s + g.monto, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden max-h-[85dvh] flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-100 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
            <Receipt size={15} className="text-red-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-stone-800">Recibos del evento</p>
            <p className="text-xs text-stone-400 truncate">{titulo}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-lg transition-colors shrink-0">
            <X size={18} className="text-stone-400" />
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={22} className="text-red-400 animate-spin" />
            </div>
          ) : gastos.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <Receipt size={28} className="text-stone-200" />
              <p className="text-sm text-stone-300 font-medium">Sin egresos registrados</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-50">
              {gastos.map((g) => (
                <div key={g.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                    <TrendingDown size={14} className="text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-semibold text-stone-700 line-clamp-1">{g.descripcion}</p>
                    <p className="text-xs text-stone-400">{formatFecha(g.fecha)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-black text-red-500">
                      -S/{g.monto.toFixed(2)}
                    </span>
                    {g.comprobante ? (
                      <a
                        href={g.comprobante}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[11px] font-bold text-blue-500
                          hover:text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors"
                      >
                        <ExternalLink size={11} /> Recibo
                      </a>
                    ) : (
                      <span className="text-[11px] text-stone-300 px-2 py-1">Sin recibo</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con total */}
        {!loading && gastos.length > 0 && (
          <div className="shrink-0 flex items-center justify-between px-5 py-3 border-t border-stone-100 bg-stone-50">
            <p className="text-xs font-bold text-stone-500">Total entregado</p>
            <p className="text-sm font-black text-red-500">-S/{total.toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
