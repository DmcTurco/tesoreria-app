import { useEffect, useState } from "react";
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  Wallet,
} from "lucide-react";
import useApi from "../../hook/useApi";
import { MOVIMIENTO_TIPO, EVENTO_TIPO_LABEL } from "../../constants/estados";

export default function Transparencia() {
  const [tab, setTab] = useState("movimientos");
  const [movData, setMovData] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const api = useApi();

  useEffect(() => {
    setLoading(true);
    Promise.all([api.get("/movimientos"), api.get("/eventos")])
      .then(([mov, evs]) => {
        setMovData(mov);
        setEventos(Array.isArray(evs) ? evs : []);
      })
      .catch(() => setError("Error al cargar información"))
      .finally(() => setLoading(false));
  }, []);

  const saldo = Number(movData?.saldo ?? 0);
  const ingresos = Number(movData?.total_ingresos ?? 0);
  const egresos = Number(movData?.total_egresos ?? 0);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-black text-stone-800">Transparencia</h1>
        <p className="text-sm text-stone-400">
          Información financiera y eventos de la APAFA
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* ── Resumen financiero siempre visible ── */}
      {!loading && movData && (
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          {/* Saldo total destacado */}
          <div
            className={`px-5 py-4 flex items-center gap-4
            ${saldo >= 0 ? "bg-emerald-50" : "bg-red-50"}`}
          >
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0
              ${saldo >= 0 ? "bg-emerald-100" : "bg-red-100"}`}
            >
              <Wallet
                size={20}
                className={saldo >= 0 ? "text-emerald-600" : "text-red-500"}
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-stone-500">
                Saldo total de la APAFA
              </p>
              <p
                className={`text-2xl font-black ${saldo >= 0 ? "text-emerald-700" : "text-red-600"}`}
              >
                S/ {saldo.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Ingresos y egresos */}
          <div className="grid grid-cols-2 divide-x divide-stone-100">
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <TrendingUp size={15} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] text-stone-400 font-medium">
                  Ingresos
                </p>
                <p className="text-base font-black text-emerald-700">
                  S/ {ingresos.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <TrendingDown size={15} className="text-red-400" />
              </div>
              <div>
                <p className="text-[11px] text-stone-400 font-medium">
                  Egresos
                </p>
                <p className="text-base font-black text-red-500">
                  S/ {egresos.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle */}
      <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
        {[
          ["movimientos", "Detalle de movimientos"],
          ["eventos", "Eventos"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all
              ${tab === k ? "bg-white text-rose-600 shadow-sm" : "text-stone-500"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="text-rose-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* ── Movimientos ── */}
          {tab === "movimientos" && (
            <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50">
              {(movData?.data ?? []).length === 0 ? (
                <p className="text-center text-stone-400 text-sm py-8">
                  Sin movimientos registrados
                </p>
              ) : (
                (movData?.data ?? []).map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
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
          )}

          {/* ── Eventos ── */}
          {tab === "eventos" && (
            <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50">
              {eventos.length === 0 ? (
                <p className="text-center text-stone-400 text-sm py-8">
                  Sin eventos registrados
                </p>
              ) : (
                eventos.map((e) => (
                  <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 mt-0.5">
                      <CalendarDays size={16} className="text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                          {EVENTO_TIPO_LABEL[e.tipo]}
                        </span>
                        {e.tiene_multa && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-400">
                            Multa S/{e.multa_monto}
                          </span>
                        )}
                        {e.estado === 1 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-400">
                            Cerrado
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-stone-700">
                        {e.titulo}
                      </p>
                      <p className="text-xs text-stone-400">
                        {formatFecha(e.fecha_inicio)}
                        {e.fecha_fin
                          ? ` → ${formatFecha(e.fecha_fin)}`
                          : " (sin fecha límite)"}
                      </p>
                      {e.descripcion && (
                        <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">
                          {e.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function formatFecha(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
