import { useEffect, useState } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Loader2,
  Trash2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Users,
  X,
} from "lucide-react";
import { useMovimientos } from "../../hook/useMovimientos";
import { useEventos } from "../../hook/useEventos";
import {
  MOVIMIENTO_TIPO,
  MOVIMIENTO_CATEGORIA_LABEL,
  MOVIMIENTO_CATEGORIA,
} from "../../constants/estados";
import { formatFecha, Toast, today } from "../../utils/utility";
import MovimientoEventoDetalle from "./movimiento/MovimientoEventoDetalle";
import useApi from "../../hook/useApi";

export default function Movimientos() {
  const [filtroTipo, setFiltroTipo] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;
  const [tabPrincipal, setTabPrincipal] = useState("todos"); // "todos" | "eventos"
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [eventoDetalle, setEventoDetalle] = useState(null);

  const {
    loading,
    error,
    movimientos,
    totalRegistros,
    totalIngresos,
    totalEgresos,
    saldo,
    getMovimientos,
    createMovimiento,
    deleteMovimiento,
  } = useMovimientos();

  const totalPages = Math.ceil(totalRegistros / PER_PAGE);

  const {
    loading: loadingEventos,
    eventos,
    getEventos,
    getEventoMovimientos,
  } = useEventos();

  useEffect(() => {
    getMovimientos({ tipo: filtroTipo !== "" ? Number(filtroTipo) : null, page, per_page: PER_PAGE });
  }, [filtroTipo, page]);

  useEffect(() => {
    if (tabPrincipal === "eventos") getEventos();
  }, [tabPrincipal]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const reload = () =>
    getMovimientos({ tipo: filtroTipo !== "" ? Number(filtroTipo) : null, page, per_page: PER_PAGE });

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
    // h calculado: 100dvh - header mobile (3.5rem) - bottom nav (5rem) - padding wrapper (3rem) = 11.5rem
    <div className="flex flex-col gap-4 h-[calc(100dvh-11.5rem)] lg:h-auto overflow-hidden w-full">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
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
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 shrink-0">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        <div className="bg-emerald-50 rounded-2xl p-3 text-center min-w-0 overflow-hidden">
          <TrendingUp size={16} className="text-emerald-500 mx-auto mb-1" />
          <p className="text-sm font-black text-emerald-700 leading-tight wrap-break-word">
            S/{Number(totalIngresos).toFixed(2)}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">Ingresos</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-3 text-center min-w-0 overflow-hidden">
          <TrendingDown size={16} className="text-red-400 mx-auto mb-1" />
          <p className="text-sm font-black text-red-500 leading-tight wrap-break-word">
            S/{Number(totalEgresos).toFixed(2)}
          </p>
          <p className="text-[11px] text-red-400 font-medium">Egresos</p>
        </div>
        <div className={`rounded-2xl p-3 text-center min-w-0 overflow-hidden ${saldo >= 0 ? "bg-amber-50" : "bg-orange-50"}`}>
          <p className="text-[11px] font-medium text-stone-400 mb-1">Saldo</p>
          <p className={`text-sm font-black leading-tight wrap-break-word ${saldo >= 0 ? "text-amber-700" : "text-orange-600"}`}>
            S/{Number(saldo).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Tabs principal */}
      <div className="flex bg-stone-100 rounded-xl p-1 gap-1 shrink-0">
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
        <div className="flex flex-col flex-1 min-h-0 gap-3">
          {/* Filtros */}
          <div className="flex gap-2 shrink-0">
            {[
              ["", "Todos"],
              ["0", "Ingresos"],
              ["1", "Egresos"],
            ].map(([v, l]) => (
              <button
                key={v}
                onClick={() => { setFiltroTipo(v); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all
                  ${filtroTipo === v
                    ? "bg-amber-500 text-white"
                    : "bg-white border border-stone-200 text-stone-500 hover:border-amber-300"
                  }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Lista — scrollable dentro del contenedor */}
          <div className="flex-1 min-h-0 rounded-2xl border border-stone-100 overflow-hidden">
            <div className="h-full overflow-y-auto overflow-x-hidden bg-white divide-y divide-stone-50">
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
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3 group">
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
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-sm font-semibold text-stone-700 line-clamp-2 wrap-break-word">
                        {m.descripcion}
                      </p>
                      <p className="text-xs text-stone-400 wrap-break-word">
                        {MOVIMIENTO_CATEGORIA_LABEL[m.categoria]} · {formatFecha(m.fecha)}
                      </p>
                    </div>
                    <span
                      className={`text-sm font-bold shrink-0 max-w-24 truncate
                        ${m.tipo === MOVIMIENTO_TIPO.INGRESO ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {m.tipo === MOVIMIENTO_TIPO.INGRESO ? "+" : "-"}S/{Number(m.monto).toFixed(2)}
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
          </div>

          {/* Paginador — siempre al fondo del contenedor */}
          {totalPages > 1 && (
            <div className="shrink-0 flex items-center justify-between bg-white rounded-2xl border border-stone-100 px-3 py-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="p-2 rounded-xl text-stone-400 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs text-stone-400">
                Página <span className="font-bold text-stone-600">{page}</span> de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-xl text-stone-400 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Por Evento ── */}
      {tabPrincipal === "eventos" && (
        <div className="flex-1 min-h-0 rounded-2xl border border-stone-100 overflow-hidden">
          <div className="h-full overflow-y-auto bg-white divide-y divide-stone-50">
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
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                        <Users size={15} className="text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-stone-700 truncate">
                          {e.titulo}
                        </p>
                        <p className="text-xs text-stone-400">
                          S/ {Number(e.multa_monto).toFixed(2)} · {formatFecha(e.fecha_inicio)}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-stone-300 shrink-0" />
                    </div>

                    {e.resumen_pagos && (
                      <div className="ml-12 flex flex-col gap-1.5">
                        <div className="flex gap-2">
                          <div className="flex-1 bg-stone-50 rounded-xl px-3 py-2">
                            <p className="text-[10px] text-stone-400">Padres</p>
                            <p className="text-xs font-black text-stone-700">
                              {e.resumen_pagos.pagados}
                              <span className="font-normal text-stone-400">/{e.resumen_pagos.total_padres}</span>
                            </p>
                          </div>
                          <div className="flex-1 bg-emerald-50 rounded-xl px-3 py-2">
                            <p className="text-[10px] text-emerald-600">Recaudado</p>
                            <p className="text-xs font-black text-emerald-700">
                              S/ {Number(e.resumen_pagos.monto_recaudado).toFixed(2)}
                            </p>
                          </div>
                          <div className="flex-1 bg-amber-50 rounded-xl px-3 py-2">
                            <p className="text-[10px] text-amber-600">Esperado</p>
                            <p className="text-xs font-black text-amber-700">
                              S/ {Number(e.resumen_pagos.monto_esperado).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {e.resumen_pagos.monto_entregado > 0 && (
                          <div className="flex items-center justify-between bg-red-50 rounded-xl px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <TrendingDown size={13} className="text-red-400 shrink-0" />
                              <p className="text-[10px] text-red-500 font-bold">Entregado / Gastos</p>
                            </div>
                            <p className="text-xs font-black text-red-500">
                              - S/ {Number(e.resumen_pagos.monto_entregado).toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                ))
            )}
          </div>
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

// ── Modal nuevo movimiento manual ─────────────────────────────────────────────
function ModalNuevoMovimiento({ createMovimiento, onClose, onSaved, onError }) {
  const [tipo,        setTipo]        = useState(MOVIMIENTO_TIPO.EGRESO);
  const [monto,       setMonto]       = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria,   setCategoria]   = useState(String(MOVIMIENTO_CATEGORIA.OTRO));
  const [fecha,       setFecha]       = useState(today());
  const [eventoId,    setEventoId]    = useState("");
  const [eventos,     setEventos]     = useState([]);
  const [saving,      setSaving]      = useState(false);
  const api = useApi();

  useEffect(() => {
    api.get("/eventos")
      .then((data) => setEventos(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!monto || !descripcion || !fecha) return;
    setSaving(true);
    try {
      await createMovimiento({
        tipo:        Number(tipo),
        monto:       Number(monto),
        descripcion: descripcion.trim(),
        categoria:   Number(categoria),
        fecha,
        evento_id:   eventoId !== "" ? Number(eventoId) : null,
      });
      onSaved();
    } catch (err) {
      onError(err.message ?? "Error al registrar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden max-h-[90dvh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
          <p className="text-sm font-black text-stone-800">Nuevo movimiento</p>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-lg transition-colors">
            <X size={18} className="text-stone-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-5 py-4 overflow-y-auto">
          {/* Tipo toggle */}
          <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
            {[
              [MOVIMIENTO_TIPO.INGRESO, "Ingreso"],
              [MOVIMIENTO_TIPO.EGRESO,  "Egreso"],
            ].map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setTipo(v)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all
                  ${tipo === v
                    ? v === MOVIMIENTO_TIPO.INGRESO
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "bg-white text-red-500 shadow-sm"
                    : "text-stone-400"}`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Monto */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-stone-500">Monto (S/)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              required
              className="h-10 px-3 rounded-xl border border-stone-200 text-sm text-stone-700
                outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Descripción */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-stone-500">Descripción</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Compra de útiles"
              required
              className="h-10 px-3 rounded-xl border border-stone-200 text-sm text-stone-700
                outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Categoría */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-stone-500">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="h-10 px-3 rounded-xl border border-stone-200 text-sm text-stone-700
                outline-none focus:border-amber-400 transition-colors bg-white"
            >
              {Object.entries(MOVIMIENTO_CATEGORIA_LABEL).map(([k, l]) => (
                <option key={k} value={k}>{l}</option>
              ))}
            </select>
          </div>

          {/* Evento relacionado (opcional) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-stone-500">
              Evento relacionado
              <span className="font-normal text-stone-400 ml-1">(opcional)</span>
            </label>
            <select
              value={eventoId}
              onChange={(e) => setEventoId(e.target.value)}
              className="h-10 px-3 rounded-xl border border-stone-200 text-sm text-stone-700
                outline-none focus:border-amber-400 transition-colors bg-white"
            >
              <option value="">— Sin evento —</option>
              {eventos.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.titulo}</option>
              ))}
            </select>
          </div>

          {/* Fecha */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-stone-500">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="h-10 px-3 rounded-xl border border-stone-200 text-sm text-stone-700
                outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-xl border border-stone-200 text-sm font-bold
                text-stone-500 hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`flex-1 h-10 rounded-xl text-sm font-bold text-white transition-colors
                flex items-center justify-center gap-2 disabled:opacity-50
                ${tipo === MOVIMIENTO_TIPO.INGRESO
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : "bg-red-500 hover:bg-red-600"}`}
            >
              {saving
                ? <Loader2 size={15} className="animate-spin" />
                : tipo === MOVIMIENTO_TIPO.INGRESO ? "Registrar ingreso" : "Registrar egreso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
