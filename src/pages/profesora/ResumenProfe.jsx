import { useEffect } from "react";
import {
  Wallet,
  Users,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useResumen } from "../../hook/useResumen";
import { MOVIMIENTO_TIPO } from "../../constants/estados";
import { formatFecha, StatCardResumen } from "../../utils/utility";

export default function ResumenProfe() {
  const { loading, error, resumen, getResumen } = useResumen();

  useEffect(() => {
    getResumen();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="text-teal-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-4 mt-4">
        <AlertCircle size={16} className="text-red-400 shrink-0" />
        <p className="text-sm text-red-500 font-medium">{error}</p>
      </div>
    );
  }

  const caja = resumen?.caja ?? {};

  return (
    <div className="flex flex-col gap-6">
      {/* Título */}
      <div>
        <h1 className="text-xl font-black text-stone-800">Resumen general</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          {new Date().toLocaleDateString("es-PE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      {/* ── Cards ── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCardResumen
          label="Saldo en caja"
          value={`S/ ${Number(caja.saldo_total ?? 0).toFixed(2)}`}
          icon={Wallet}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          trend={caja.saldo_total >= 0 ? "up" : "down"}
        />
        <StatCardResumen
          label="Padres registrados"
          value={resumen?.total_padres ?? 0}
          icon={Users}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
      </div>

      {/* ── Últimos movimientos — solo lectura ── */}
      <div className="bg-white rounded-2xl border border-stone-100">
        <div className="px-5 py-4 border-b border-stone-50">
          <p className="text-sm font-black text-stone-700">
            Últimos movimientos
          </p>
          <p className="text-xs text-stone-400 mt-0.5">
            Solo lectura — información de transparencia
          </p>
        </div>

        <div className="divide-y divide-stone-50">
          {(resumen?.ultimos_movimientos ?? []).length === 0 ? (
            <p className="text-center text-stone-400 text-sm py-8">
              Sin movimientos aún
            </p>
          ) : (
            (resumen?.ultimos_movimientos ?? []).map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                  ${m.tipo === MOVIMIENTO_TIPO.INGRESO ? "bg-emerald-50" : "bg-red-50"}`}
                >
                  {m.tipo === MOVIMIENTO_TIPO.INGRESO ? (
                    <TrendingUp size={14} className="text-emerald-500" />
                  ) : (
                    <TrendingDown size={14} className="text-red-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-700 truncate">
                    {m.descripcion}
                  </p>
                  <p className="text-xs text-stone-400">
                    {m.categoria} · {formatFecha(m.fecha)}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold shrink-0
                  ${m.tipo === MOVIMIENTO_TIPO.INGRESO ? "text-emerald-600" : "text-red-500"}`}
                >
                  {m.tipo === MOVIMIENTO_TIPO.INGRESO ? "+" : "-"}S/{" "}
                  {Number(m.monto).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
