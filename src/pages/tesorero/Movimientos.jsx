import { useEffect, useState } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Loader2,
  X,
  Trash2,
  AlertCircle,
  ChevronRight,
  Users,
} from "lucide-react";
import { useMovimientos } from "../../hook/useMovimientos";
import { useEventos } from "../../hook/useEventos";
import {
  MOVIMIENTO_TIPO,
  MOVIMIENTO_CATEGORIA_LABEL,
} from "../../constants/estados";
import { formatFecha, Toast } from "../../utils/utility";
import MovimientoEventoDetalle from "./movimiento/MovimientoEventoDetalle";

export default function Movimientos() {
  const [filtroTipo, setFiltroTipo] = useState("");
  const [tabPrincipal, setTabPrincipal] = useState("todos"); // "todos" | "eventos"
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [eventoDetalle, setEventoDetalle] = useState(null); // evento seleccionado

  const {
    loading,
    error,
    movimientos,
    totalIngresos,
    totalEgresos,
    saldo,
    getMovimientos,
    createMovimiento,
    deleteMovimiento,
  } = useMovimientos();

  const {
    loading: loadingEventos,
    eventos,
    getEventos,
    getEventoMovimientos,
  } = useEventos();

  useEffect(() => {
    getMovimientos({ tipo: filtroTipo !== "" ? Number(filtroTipo) : null });
  }, [filtroTipo]);

  useEffect(() => {
    if (tabPrincipal === "eventos") getEventos();
  }, [tabPrincipal]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const reload = () =>
    getMovimientos({ tipo: filtroTipo !== "" ? Number(filtroTipo) : null });

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este movimiento?")) return;
    try {
      await deleteMovimiento(id);
      showToast("Eliminado");
      reload();
    } catch (e) {
      showToast(e.message ?? "Error", "err");
    }
  };

  // Si hay un evento seleccionado → mostrar detalle
  if (eventoDetalle) {
    return (
      <MovimientoEventoDetalle
        evento={eventoDetalle}
        getEventoMovimientos={getEventoMovimientos}
        onBack={() => setEventoDetalle(null)}
        onToast={showToast}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-stone-800">Movimientos</h1>
          <p className="text-sm text-stone-400">Ingresos y egresos</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Agregar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-2xl p-4 text-center">
          <TrendingUp size={18} className="text-emerald-500 mx-auto mb-1" />
          <p className="text-lg font-black text-emerald-700">
            S/ {Number(totalIngresos).toFixed(2)}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">Ingresos</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 text-center">
          <TrendingDown size={18} className="text-red-400 mx-auto mb-1" />
          <p className="text-lg font-black text-red-500">
            S/ {Number(totalEgresos).toFixed(2)}
          </p>
          <p className="text-[11px] text-red-400 font-medium">Egresos</p>
        </div>
        <div
          className={`rounded-2xl p-4 text-center ${saldo >= 0 ? "bg-amber-50" : "bg-orange-50"}`}
        >
          <p className="text-[11px] font-medium text-stone-400 mb-1">Saldo</p>
          <p
            className={`text-lg font-black ${saldo >= 0 ? "text-amber-700" : "text-orange-600"}`}
          >
            S/ {Number(saldo).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tabs principal */}
      <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
        {[
          ["todos", "Todos"],
          ["eventos", "Por Evento"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTabPrincipal(k)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all
							${tabPrincipal === k ? "bg-white text-amber-600 shadow-sm" : "text-stone-500"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ── Tab Todos ── */}
      {tabPrincipal === "todos" && (
        <>
          <div className="flex gap-2">
            {[
              ["", "Todos"],
              ["0", "Ingresos"],
              ["1", "Egresos"],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFiltroTipo(v)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all
									${
                    filtroTipo === v
                      ? "bg-amber-500 text-white"
                      : "bg-white border border-stone-200 text-stone-500 hover:border-amber-300"
                  }`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={24} className="text-amber-400 animate-spin" />
              </div>
            ) : movimientos.length === 0 ? (
              <p className="text-center text-stone-400 text-sm py-10">
                Sin movimientos
              </p>
            ) : (
              movimientos.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 px-4 py-3 group"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0
										${m.tipo === MOVIMIENTO_TIPO.INGRESO ? "bg-emerald-50" : "bg-red-50"}`}
                  >
                    {m.tipo === MOVIMIENTO_TIPO.INGRESO ? (
                      <TrendingUp size={15} className="text-emerald-500" />
                    ) : (
                      <TrendingDown size={15} className="text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-700 truncate">
                      {m.descripcion}
                    </p>
                    <p className="text-xs text-stone-400">
                      {MOVIMIENTO_CATEGORIA_LABEL[m.categoria]} ·{" "}
                      {formatFecha(m.fecha)}
                    </p>
                  </div>
                  <span
                    className={`text-sm font-bold shrink-0
										${m.tipo === MOVIMIENTO_TIPO.INGRESO ? "text-emerald-600" : "text-red-500"}`}
                  >
                    {m.tipo === MOVIMIENTO_TIPO.INGRESO ? "+" : "-"}S/{" "}
                    {Number(m.monto).toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="text-stone-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ── Tab Por Evento ── */}
      {tabPrincipal === "eventos" && (
        <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50">
          {loadingEventos ? (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="text-amber-400 animate-spin" />
            </div>
          ) : eventos.filter((e) => e.tipo === 3).length === 0 ? (
            <p className="text-center text-stone-400 text-sm py-10">
              Sin eventos de cuota
            </p>
          ) : (
            eventos
              .filter((e) => e.tipo === 3)
              .map((e) => (
                <button
                  key={e.id}
                  onClick={() => setEventoDetalle(e)}
                  className="w-full flex flex-col gap-2 px-4 py-3 hover:bg-stone-50 transition-colors text-left border-b border-stone-50 last:border-0"
                >
                  {/* Fila superior */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                      <Users size={15} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-stone-700 truncate">
                        {e.titulo}
                      </p>
                      <p className="text-xs text-stone-400">
                        S/ {Number(e.multa_monto).toFixed(2)} ·{" "}
                        {formatFecha(e.fecha_inicio)}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-stone-300 shrink-0"
                    />
                  </div>

                  {/* Resumen pagos */}
                  {e.resumen_pagos && (
                    <div className="ml-12 flex gap-3">
                      {/* Padres */}
                      <div className="flex-1 bg-stone-50 rounded-xl px-3 py-2">
                        <p className="text-[10px] text-stone-400">Padres</p>
                        <p className="text-xs font-black text-stone-700">
                          {e.resumen_pagos.pagados}
                          <span className="font-normal text-stone-400">
                            /{e.resumen_pagos.total_padres}
                          </span>
                        </p>
                      </div>
                      {/* Recaudado */}
                      <div className="flex-1 bg-emerald-50 rounded-xl px-3 py-2">
                        <p className="text-[10px] text-emerald-600">
                          Recaudado
                        </p>
                        <p className="text-xs font-black text-emerald-700">
                          S/{" "}
                          {Number(e.resumen_pagos.monto_recaudado).toFixed(2)}
                        </p>
                      </div>
                      {/* Esperado */}
                      <div className="flex-1 bg-amber-50 rounded-xl px-3 py-2">
                        <p className="text-[10px] text-amber-600">Esperado</p>
                        <p className="text-xs font-black text-amber-700">
                          S/ {Number(e.resumen_pagos.monto_esperado).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}
                </button>
              ))
          )}
        </div>
      )}

      {modal && (
        <ModalNuevoMovimiento
          createMovimiento={createMovimiento}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            showToast("Movimiento registrado");
            reload();
          }}
          onError={(msg) => showToast(msg, "err")}
        />
      )}
    </div>
  );
}
