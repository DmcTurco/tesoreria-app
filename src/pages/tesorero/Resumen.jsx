import { useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertTriangle,
  CalendarDays,
  Users,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useResumen } from "../../hook/useResumen";
import { MOVIMIENTO_TIPO } from "../../constants/estados";

export default function Resumen({ onTabChange }) {
  const { loading, error, resumen, getResumen } = useResumen();

  useEffect(() => {
    getResumen();
  }, []);

  if (loading) return <LoadingState />;

  if (error)
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-4 mt-4">
        <AlertCircle size={16} className="text-red-400 shrink-0" />
        <p className="text-sm text-red-500 font-medium">{error}</p>
      </div>
    );

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

      {/* Cards principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Saldo total"
          value={`S/ ${Number(caja.saldo_total ?? 0).toFixed(2)}`}
          icon={Wallet}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          trend={caja.saldo_total >= 0 ? "up" : "down"}
        />
        <StatCard
          label="Ingresos del mes"
          value={`S/ ${Number(caja.ingresos_mes ?? 0).toFixed(2)}`}
          icon={TrendingUp}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Egresos del mes"
          value={`S/ ${Number(caja.egresos_mes ?? 0).toFixed(2)}`}
          icon={TrendingDown}
          iconBg="bg-red-100"
          iconColor="text-red-500"
        />
        <StatCard
          label="Multas pendientes"
          value={`S/ ${Number(resumen?.multas?.monto_pendiente ?? 0).toFixed(2)}`}
          sub={`${resumen?.multas?.cantidad ?? 0} sin cobrar`}
          icon={AlertTriangle}
          iconBg="bg-orange-100"
          iconColor="text-orange-500"
        />
      </div>

      {/* Segunda fila */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center gap-4 cursor-pointer hover:border-amber-200 transition-colors"
          onClick={() => onTabChange("padres")}
        >
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Users size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-stone-800">
              {resumen?.total_padres ?? 0}
            </p>
            <p className="text-xs text-stone-400 font-medium">
              Padres registrados
            </p>
          </div>
        </div>
        <div
          className="bg-white rounded-2xl border border-stone-100 p-4 flex items-center gap-4 cursor-pointer hover:border-amber-200 transition-colors"
          onClick={() => onTabChange("eventos")}
        >
          <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
            <CalendarDays size={20} className="text-teal-500" />
          </div>
          <div>
            <p className="text-2xl font-black text-stone-800">
              {resumen?.eventos_activos ?? 0}
            </p>
            <p className="text-xs text-stone-400 font-medium">
              Eventos activos
            </p>
          </div>
        </div>
      </div>

      {/* Últimos movimientos */}
      <div className="bg-white rounded-2xl border border-stone-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-50">
          <p className="text-sm font-black text-stone-700">
            Últimos movimientos
          </p>
          <button
            onClick={() => onTabChange("movimientos")}
            className="flex items-center gap-1 text-xs text-amber-500 font-semibold hover:text-amber-600"
          >
            Ver todos <ArrowRight size={13} />
          </button>
        </div>
        <div className="divide-y divide-stone-50">
          {(resumen?.ultimos_movimientos ?? []).length === 0 && (
            <p className="text-center text-stone-400 text-sm py-8">
              Sin movimientos aún
            </p>
          )}
          {(resumen?.ultimos_movimientos ?? []).map((m) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Atoms ─────────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, trend }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-4">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}
        >
          <Icon size={17} className={iconColor} />
        </div>
        {trend === "up" && (
          <TrendingUp size={13} className="text-emerald-400" />
        )}
        {trend === "down" && (
          <TrendingDown size={13} className="text-red-400" />
        )}
      </div>
      <p className="text-xl font-black text-stone-800 leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-stone-400 mt-0.5">{sub}</p>}
      <p className="text-xs text-stone-400 mt-1">{label}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="text-amber-400 animate-spin" />
    </div>
  );
}

function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
  });
}
