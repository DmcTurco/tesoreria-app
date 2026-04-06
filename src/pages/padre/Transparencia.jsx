import { useEffect, useState } from "react";
import ModalRecibosEvento from "../../components/ModalRecibosEvento";
import {
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Loader2,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Users,
} from "lucide-react";
import useApi from "../../hook/useApi";
import { useMovimientos } from "../../hook/useMovimientos";
import { useEventos } from "../../hook/useEventos";
import {
  MOVIMIENTO_TIPO,
  MOVIMIENTO_CATEGORIA_LABEL,
  EVENTO_TIPO_LABEL,
} from "../../constants/estados";
import { formatFecha, StatCardResumen } from "../../utils/utility";

export default function Transparencia() {
  const [tab, setTab] = useState("movimientos");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const {
    loading: loadingMov,
    movimientos,
    totalRegistros,
    totalIngresos,
    totalEgresos,
    saldo,
    getMovimientos,
  } = useMovimientos();

  const { loading: loadingEventos, eventos, getEventos } = useEventos();

  const totalPages = Math.ceil(totalRegistros / PER_PAGE);

  useEffect(() => {
    if (tab === "movimientos") {
      getMovimientos({
        tipo: filtroTipo !== "" ? Number(filtroTipo) : null,
        page,
        per_page: PER_PAGE,
      });
    }
  }, [tab, filtroTipo, page]);

  useEffect(() => {
    if (tab === "eventos") getEventos();
  }, [tab]);

  return (
    <div className="flex flex-col gap-4 h-[calc(100dvh-11.5rem)] lg:h-auto overflow-hidden w-full">

      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-xl font-black text-stone-800">Transparencia</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Información financiera y eventos de la APAFA
        </p>
      </div>

      {/* Saldo destacado */}
      <div className="shrink-0 grid grid-cols-2 gap-3">
        <StatCardResumen
          label="Saldo en caja"
          value={`S/ ${Number(saldo).toFixed(2)}`}
          icon={Wallet}
          iconBg="bg-amber-100"
          iconColor="text-amber-600"
          trend={saldo >= 0 ? "up" : "down"}
        />
        <StatCardResumen
          label="Total ingresos"
          value={`S/ ${Number(totalIngresos).toFixed(2)}`}
          icon={TrendingUp}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-600"
          trend="up"
        />
      </div>

      {/* Tabs */}
      <div className="shrink-0 flex bg-stone-100 rounded-xl p-1 gap-1">
        {[
          ["movimientos", "Movimientos"],
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

      {/* ── Tab Movimientos ── */}
      {tab === "movimientos" && (
        <div className="flex flex-col flex-1 min-h-0 gap-3">

          {/* Mini totales */}
          <div className="shrink-0 grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 rounded-2xl p-3 text-center min-w-0 overflow-hidden">
              <TrendingUp size={14} className="text-emerald-500 mx-auto mb-1" />
              <p className="text-xs font-black text-emerald-700 leading-tight wrap-break-word">
                S/{Number(totalIngresos).toFixed(2)}
              </p>
              <p className="text-[10px] text-emerald-600 font-medium">Ingresos</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-3 text-center min-w-0 overflow-hidden">
              <TrendingDown size={14} className="text-red-400 mx-auto mb-1" />
              <p className="text-xs font-black text-red-500 leading-tight wrap-break-word">
                S/{Number(totalEgresos).toFixed(2)}
              </p>
              <p className="text-[10px] text-red-400 font-medium">Egresos</p>
            </div>
            <div className={`rounded-2xl p-3 text-center min-w-0 overflow-hidden ${saldo >= 0 ? "bg-amber-50" : "bg-orange-50"}`}>
              <p className="text-[10px] font-medium text-stone-400 mb-1">Saldo</p>
              <p className={`text-xs font-black leading-tight wrap-break-word ${saldo >= 0 ? "text-amber-700" : "text-orange-600"}`}>
                S/{Number(saldo).toFixed(2)}
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="shrink-0 flex gap-2">
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
                    ? "bg-rose-500 text-white"
                    : "bg-white border border-stone-200 text-stone-500 hover:border-rose-300"
                  }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Lista */}
          <div className="flex-1 min-h-0 rounded-2xl border border-stone-100 overflow-hidden">
            <div className="h-full overflow-y-auto overflow-x-hidden bg-white divide-y divide-stone-50">
              {loadingMov ? (
                <div className="flex justify-center py-10">
                  <Loader2 size={24} className="text-rose-400 animate-spin" />
                </div>
              ) : movimientos.length === 0 ? (
                <p className="text-center text-stone-400 text-sm py-10">Sin movimientos</p>
              ) : (
                movimientos.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs text-stone-400 wrap-break-word">
                          {MOVIMIENTO_CATEGORIA_LABEL[m.categoria]} · {formatFecha(m.fecha)}
                        </p>
                        {m.comprobante && (
                          <a href={m.comprobante} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-0.5 text-[10px] font-bold text-blue-500 hover:text-blue-600 transition-colors">
                            🔗 Recibo
                          </a>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold shrink-0 max-w-24 wrap-break-word
                        ${m.tipo === MOVIMIENTO_TIPO.INGRESO ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {m.tipo === MOVIMIENTO_TIPO.INGRESO ? "+" : "-"}S/{Number(m.monto).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Paginador */}
          {totalPages > 1 && (
            <div className="shrink-0 flex items-center justify-between bg-white rounded-2xl border border-stone-100 px-3 py-2">
              <button
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="p-2 rounded-xl text-stone-400 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-xs text-stone-400">
                Página <span className="font-bold text-stone-600">{page}</span> de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-xl text-stone-400 hover:text-rose-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Tab Eventos ── */}
      {tab === "eventos" && (
        <div className="flex-1 min-h-0 rounded-2xl border border-stone-100 overflow-hidden">
          <div className="h-full overflow-y-auto bg-white divide-y divide-stone-50">
            {loadingEventos ? (
              <div className="flex justify-center py-10">
                <Loader2 size={24} className="text-rose-400 animate-spin" />
              </div>
            ) : eventos.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <Users size={28} className="text-stone-200" />
                <p className="text-sm text-stone-300 font-medium">Sin eventos registrados</p>
              </div>
            ) : (
              eventos.map((e) => <EventoCardPadre key={e.id} evento={e} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tarjeta de evento con historial de precio expandible ──────────────────────
function EventoCardPadre({ evento: e }) {
  const [abierto,      setAbierto]      = useState(false);
  const [historial,    setHistorial]    = useState(null);
  const [loadingH,     setLoadingH]     = useState(false);
  const [modalRecibos, setModalRecibos] = useState(false);
  const api = useApi();

  const toggleHistorial = async () => {
    if (!abierto && historial === null) {
      setLoadingH(true);
      try {
        const res = await api.get(`/eventos/${e.id}/precio-historial`);
        setHistorial(Array.isArray(res) ? res : []);
      } catch {
        setHistorial([]);
      } finally {
        setLoadingH(false);
      }
    }
    setAbierto((v) => !v);
  };

  return (
    <div className="flex flex-col px-4 py-3 gap-2">
      {/* Cabecera */}
      <button onClick={toggleHistorial} className="flex items-center gap-3 w-full text-left">
        <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
          <CalendarDays size={15} className="text-rose-400" />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
              {EVENTO_TIPO_LABEL[e.tipo]}
            </span>
            {e.tiene_multa && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-400">
                Multa S/{Number(e.multa_monto).toFixed(2)}
              </span>
            )}
            {e.estado === 1 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-400">
                Cerrado
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-stone-700 line-clamp-2 wrap-break-word">{e.titulo}</p>
          <p className="text-xs text-stone-400 wrap-break-word">{formatFecha(e.fecha_inicio)}</p>
        </div>
        {loadingH ? (
          <Loader2 size={15} className="text-stone-300 animate-spin shrink-0" />
        ) : (
          <ChevronDown
            size={16}
            className={`text-stone-300 shrink-0 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`}
          />
        )}
      </button>

      {/* Resumen de pagos */}
      {e.resumen_pagos && (
        <div className="ml-12 flex flex-col gap-1.5">
          <div className="flex gap-3">
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
            <button
              onClick={(ev) => { ev.stopPropagation(); setModalRecibos(true); }}
              className="flex items-center justify-between bg-red-50 hover:bg-red-100 rounded-xl px-3 py-2 w-full transition-colors"
            >
              <p className="text-[10px] text-red-500 font-bold">Entregado / Gastos</p>
              <p className="text-xs font-black text-red-500">
                - S/ {Number(e.resumen_pagos.monto_entregado).toFixed(2)}
              </p>
            </button>
          )}
        </div>
      )}

      {modalRecibos && (
        <ModalRecibosEvento
          eventoId={e.id}
          titulo={e.titulo}
          onClose={() => setModalRecibos(false)}
        />
      )}

      {/* Historial de precio */}
      {abierto && !loadingH && (
        <div className="ml-12 border-t border-dashed border-stone-100 pt-2 mt-0.5">
          {!historial || historial.length === 0 ? (
            <p className="text-[11px] text-stone-300 py-1">Sin cambios de precio</p>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">
                Historial de precio
              </p>
              {historial.map((h, i) => {
                const subio = h.monto_nuevo > h.monto_anterior;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${subio ? "bg-orange-50" : "bg-blue-50"}`}>
                      {subio
                        ? <TrendingUp size={10} className="text-orange-500" />
                        : <TrendingDown size={10} className="text-blue-500" />}
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-[11px] text-stone-500 wrap-break-word">
                        <span className="font-bold text-stone-700">S/ {h.monto_anterior.toFixed(2)}</span>
                        {" → "}
                        <span className={`font-bold ${subio ? "text-orange-600" : "text-blue-600"}`}>
                          S/ {h.monto_nuevo.toFixed(2)}
                        </span>
                      </p>
                      <p className="text-[10px] text-stone-400">{formatFecha(h.fecha)}</p>
                    </div>
                    <span className={`text-[11px] font-black shrink-0 ${subio ? "text-orange-500" : "text-blue-500"}`}>
                      {subio ? "+" : "-"}S/ {Math.abs(h.monto_nuevo - h.monto_anterior).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
