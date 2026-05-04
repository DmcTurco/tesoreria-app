import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  TrendingDown,
  Search,
  Receipt,
} from "lucide-react";
import { formatFecha } from "../../../utils/utility";
import FilaPadreMovimiento from "./FilaPadreMovimiento";

export default function MovimientoEventoDetalle({
  evento,
  getEventoMovimientos,
  onBack,
  onToast,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  const padresFiltrados = !data
    ? []
    : data.padres.filter((p) => {
        const q = busqueda.toLowerCase();
        return (
          p.nombre?.toLowerCase().includes(q) ||
          p.codigo?.toLowerCase().includes(q) ||
          p.hijo?.toLowerCase().includes(q)
        );
      });

  const cargar = async () => {
    try {
      setLoading(true);
      const res = await getEventoMovimientos(evento.id);
      setData(res);
    } catch (e) {
      onToast("Error al cargar movimientos", "err");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [evento.id]);

  return (
    <div className="flex flex-col gap-4 h-[calc(100dvh-10rem)] lg:h-auto overflow-hidden w-full">
      {/* Header */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors shrink-0"
        >
          <ArrowLeft size={16} className="text-stone-600" />
        </button>
        <div className="flex-1 min-w-0 overflow-hidden">
          <h1 className="text-lg font-black text-stone-800 line-clamp-2 wrap-break-word">
            {evento.titulo}
          </h1>
          <p className="text-xs text-stone-400">Detalle de pagos por padre</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="text-amber-400 animate-spin" />
        </div>
      ) : !data ? null : (
        <>
          {/* Resumen del evento */}
          <div className="flex flex-col gap-2 shrink-0">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-stone-50 rounded-2xl p-3 text-center min-w-0">
                <p className="text-lg font-black text-stone-700">{data.evento.total_padres}</p>
                <p className="text-[11px] text-stone-400">Total</p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-3 text-center min-w-0">
                <p className="text-lg font-black text-emerald-700">{data.evento.pagados}</p>
                <p className="text-[11px] text-emerald-600">Pagados</p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-3 text-center min-w-0">
                <p className="text-lg font-black text-amber-600">{data.evento.pendientes}</p>
                <p className="text-[11px] text-amber-500">Pendientes</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-teal-50 rounded-2xl p-3 text-center min-w-0">
                <p className="text-sm font-black text-teal-700">
                  S/ {Number(data.evento.monto_recaudado ?? 0).toFixed(2)}
                </p>
                <p className="text-[11px] text-teal-600">Recaudado</p>
              </div>
              <div className="bg-stone-50 rounded-2xl p-3 text-center min-w-0">
                <p className="text-sm font-black text-stone-600">
                  S/ {Number(data.evento.monto_esperado ?? 0).toFixed(2)}
                </p>
                <p className="text-[11px] text-stone-400">Esperado</p>
              </div>
              <div className="bg-red-50 rounded-2xl p-3 text-center min-w-0">
                <p className="text-sm font-black text-red-500">
                  S/ {Number(data.evento.monto_entregado ?? 0).toFixed(2)}
                </p>
                <p className="text-[11px] text-red-400">Entregado</p>
              </div>
            </div>
          </div>

          {/* Historial de precios */}
          {data.precio_historial?.length > 0 && (
            <div className="shrink-0 bg-white rounded-2xl border border-stone-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-100">
                <p className="text-xs font-bold text-stone-600">Historial de precios</p>
              </div>
              <div className="divide-y divide-stone-50">
                {data.precio_historial.map((h, i) => {
                  const subio = h.monto_nuevo > h.monto_anterior;
                  return (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 overflow-hidden">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${subio ? "bg-orange-50" : "bg-blue-50"}`}>
                        {subio
                          ? <TrendingUp size={11} className="text-orange-500" />
                          : <TrendingDown size={11} className="text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p className="text-xs text-stone-500 wrap-break-word">
                          <span className="font-bold text-stone-700">S/ {h.monto_anterior.toFixed(2)}</span>
                          {" → "}
                          <span className={`font-bold ${subio ? "text-orange-600" : "text-blue-600"}`}>
                            S/ {h.monto_nuevo.toFixed(2)}
                          </span>
                        </p>
                        <p className="text-[10px] text-stone-400 wrap-break-word">
                          {h.registrado_por} · {formatFecha(h.fecha)}
                        </p>
                      </div>
                      <span className={`text-xs font-black shrink-0 ${subio ? "text-orange-500" : "text-blue-500"}`}>
                        {subio ? "+" : "-"}S/ {Math.abs(h.monto_nuevo - h.monto_anterior).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Gastos del evento */}
          {data.gastos?.length > 0 && (
            <div className="shrink-0 bg-white rounded-2xl border border-stone-100 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-b border-red-100">
                <Receipt size={14} className="text-red-400" />
                <p className="text-xs font-bold text-red-600 flex-1">Egresos / Gastos del evento</p>
                <span className="text-xs font-black text-red-500">
                  - S/ {data.gastos.reduce((s, g) => s + g.monto, 0).toFixed(2)}
                </span>
              </div>
              <div className="divide-y divide-stone-50">
                {data.gastos.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                      <TrendingDown size={13} className="text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-xs font-semibold text-stone-700 line-clamp-1">{g.descripcion}</p>
                      <p className="text-[10px] text-stone-400">{formatFecha(g.fecha)}{g.registrado_por ? ` · ${g.registrado_por}` : ""}</p>
                    </div>
                    <span className="text-xs font-black text-red-500 shrink-0">
                      - S/ {g.monto.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buscador */}
          <div className="relative shrink-0">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, código o hijo..."
              className="w-full h-10 pl-9 pr-4 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400 placeholder:text-stone-300"
            />
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
          </div>

          {/* Lista por padre — scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
            <div className="flex flex-col gap-2 pb-2">
              {padresFiltrados.map((p) => (
                <FilaPadreMovimiento
                  key={p.padre_id}
                  p={p}
                  precioHistorial={data.precio_historial ?? []}
                  eventoId={evento.id}
                  onRefresh={cargar}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
