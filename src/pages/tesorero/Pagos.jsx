import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  Search,
  Ban,
  Loader2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { useAbono } from "../../hook/useAbono";
import { usePadres } from "../../hook/usePadres";
import ModalAnulacion from "./../../constants/ModalAnulacion";
import { formatFecha, Toast, filtrarTexto } from "./../../utils/utility";

export default function Pagos() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [toast, setToast] = useState(null);
  const [abonoAAnular, setAbonoAAnular] = useState(null);

  const { loading, error, abonos, getAbonos } = useAbono();
  const { loading: loadingPadres, padres, getPadres } = usePadres();

  useEffect(() => {
    getAbonos();
    getPadres();
  }, []);

  useEffect(() => {
    getAbonos({
      estado: filtroEstado !== "" ? Number(filtroEstado) : null,
    });
  }, [filtroEstado]);

  // Mostrar toast si se viene de NuevoAbono con éxito
  useEffect(() => {
    if (location.state?.successMsg) {
      showToast(location.state.successMsg);
      window.history.replaceState({}, "");
    }
  }, []);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const reload = () =>
    getAbonos({ estado: filtroEstado !== "" ? Number(filtroEstado) : null });

  const handleAnular = (abono) => {
    const padre = padres.find((p) => p.id === abono.padre_id);
    setAbonoAAnular({ ...abono, padre_nombre: padre?.nombre ?? "—" });
  };

  const filtrados = filtrarTexto(abonos, search, [
    (a) => a.padre?.nombre,
    (a) => a.padre?.codigo,
    (a) => a.padre?.hijo,
    "tipo_deuda",
  ]);

  const agrupadosPorPadre = Object.values(
    filtrados.reduce((acc, a) => {
      const id = a.padre_id;
      if (!acc[id]) acc[id] = { padre: a.padre, abonos: [] };
      acc[id].abonos.push(a);
      return acc;
    }, {}),
  );

  return (
    <div className="flex flex-col gap-4 h-[calc(100dvh-11.5rem)] lg:h-auto overflow-hidden w-full">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-black text-stone-800">Abonos</h1>
          <p className="text-sm text-stone-400">
            Registro de cobros realizados
          </p>
        </div>
        <button
          onClick={() => navigate("nuevo")}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Registrar
        </button>
      </div>

      {error && <div className="shrink-0"><ErrorBanner msg={error} /></div>}

      {/* Buscador + filtro */}
      <div className="flex gap-2 shrink-0">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por padre o tipo..."
            className="w-full h-9 pl-8 pr-3 bg-white border border-stone-200 rounded-xl text-xs text-stone-700 outline-none focus:border-amber-400"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="h-9 px-3 bg-white border border-stone-200 rounded-xl text-xs text-stone-600 outline-none focus:border-amber-400"
        >
          <option value="">Todos</option>
          <option value="0">Activos</option>
          <option value="1">Anulados</option>
        </select>
      </div>

      {/* Lista agrupada por padre — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <div className="flex flex-col gap-3 pb-2">
          {loading || loadingPadres ? (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="text-amber-400 animate-spin" />
            </div>
          ) : agrupadosPorPadre.length === 0 ? (
            <p className="text-center text-stone-400 text-sm py-10">
              Sin resultados
            </p>
          ) : (
            agrupadosPorPadre.map(({ padre, abonos }) => (
              <GrupoPadre
                key={padre.id}
                padre={padre}
                abonos={abonos}
                handleAnular={handleAnular}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal anular abono */}
      <ModalAnulacion
        pago={abonoAAnular}
        onClose={() => setAbonoAAnular(null)}
        onSuccess={(msg) => {
          showToast(msg);
          reload();
        }}
      />
    </div>
  );
}

// ── Grupo por padre ───────────────────────────────────────────────────────────
function GrupoPadre({ padre, abonos, handleAnular }) {
  const [padreAbierto, setPadreAbierto] = useState(false);
  const [expandido, setExpandido] = useState(null);

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      {/* Cabecera padre — clickeable */}
      <div
        className="flex items-center gap-3 px-4 py-3 bg-stone-50 cursor-pointer"
        onClick={() => setPadreAbierto(!padreAbierto)}
      >
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center font-black text-amber-700 text-sm shrink-0">
          {padre.nombre[0]}
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-sm font-bold text-stone-700 line-clamp-2 wrap-break-word">
            {padre.nombre}
          </p>
          <p className="text-xs text-stone-400">{padre.codigo} · {padre.hijo}</p>
        </div>
        <span className="text-xs font-black text-emerald-600">
          S/{" "}
          {abonos
            .filter((a) => a.estado === 0)
            .reduce((s, a) => s + Number(a.monto), 0)
            .toFixed(2)}
        </span>
        <div
          className={`w-7 h-7 flex items-center justify-center rounded-full bg-stone-200 transition-transform duration-200 shrink-0 ${padreAbierto ? "rotate-180" : ""}`}
        >
          <ChevronDown size={15} className="text-stone-600" />
        </div>
      </div>

      {/* Abonos — acordión del padre */}
      {padreAbierto && (
        <div className="divide-y divide-stone-50">
          {abonos.map((a) => {
            const esCobro = a.tipo_deuda === "cobro";
            const esAnulado = Number(a.estado) === 1;
            const tieneAjustes = a.ajustes?.length > 0;
            const montoNeto = a.monto_neto;
            const diferencia =
              montoNeto !== null ? montoNeto - Number(a.monto) : null;
            const abierto = expandido === a.id;

            return (
              <div
                key={a.id}
                className={`flex flex-col px-4 py-2.5 ${esAnulado ? "opacity-60" : ""}`}
              >
                {/* Fila principal */}
                <div
                  className={`flex items-center gap-3 ${tieneAjustes && !esAnulado ? "cursor-pointer" : ""}`}
                  onClick={() =>
                    tieneAjustes &&
                    !esAnulado &&
                    setExpandido(abierto ? null : a.id)
                  }
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${esCobro ? "bg-blue-50" : "bg-red-50"}`}
                  >
                    <span
                      className={`text-[9px] font-black ${esCobro ? "text-blue-500" : "text-red-500"}`}
                    >
                      {esCobro ? "C" : "M"}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-600 truncate">
                      {a.evento?.titulo ?? a.multa?.concepto ?? a.tipo_deuda}
                    </p>
                    <p className="text-[10px] text-stone-400">
                      {formatFecha(a.fecha)}
                    </p>
                  </div>

                  <span className="text-xs font-bold text-emerald-600 shrink-0">
                    +S/ {Number(a.monto).toFixed(2)}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
						${esAnulado ? "bg-red-50 text-red-400" : "bg-emerald-50 text-emerald-600"}`}
                  >
                    {" "}
                    {/* ← rojo en vez de gris */}
                    {esAnulado ? "Anulado" : "Activo"}
                  </span>

                  {tieneAjustes && !esAnulado && (
                    <div
                      className={`w-7 h-7 flex items-center justify-center rounded-full bg-stone-100 transition-transform duration-200 shrink-0 ${abierto ? "rotate-180" : ""}`}
                    >
                      <ChevronDown size={15} className="text-stone-500" />
                    </div>
                  )}

                  {!esAnulado && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnular(a);
                      }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-300 hover:text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <Ban size={18} />
                    </button>
                  )}
                </div>
                {/* Motivo anulación */}
                {esAnulado && a.motivo_anulacion && (
                  <div className="ml-9 mt-1">
                    <p className="text-[10px] text-stone-400 italic">
                      Motivo: {a.motivo_anulacion}
                    </p>
                  </div>
                )}
                {/* Acordión ajustes */}
                {tieneAjustes && !esAnulado && abierto && (
                  <div className="ml-9 flex flex-col gap-1 bg-stone-50 rounded-lg px-3 py-2 mt-2">
                    {a.ajustes.map((aj, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-[10px] text-stone-400 truncate flex-1">
                          {aj.tipo === 1 ? "Devolución" : "Cobro extra"}
                        </span>
                        <span
                          className={`text-[10px] font-bold shrink-0
                          ${aj.tipo === 1 ? "text-blue-500" : "text-orange-500"}`}
                        >
                          {aj.tipo === 1 ? "-" : "+"}S/ {aj.monto.toFixed(2)}
                        </span>
                      </div>
                    ))}

                    <div className="flex items-center justify-between border-t border-dashed border-stone-200 pt-1 mt-0.5">
                      <span className="text-[10px] font-bold text-stone-500">
                        Neto pagado
                      </span>
                      <span
                        className={`text-[10px] font-black
                        ${diferencia < 0 ? "text-blue-600" : diferencia > 0 ? "text-orange-600" : "text-emerald-600"}`}
                      >
                        S/ {montoNeto?.toFixed(2)}
                        {diferencia !== null && diferencia !== 0 && (
                          <span className="ml-1 font-normal text-stone-400">
                            ({diferencia > 0 ? "+" : ""}
                            {diferencia.toFixed(2)})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── ErrorBanner ───────────────────────────────────────────────────────────────
function ErrorBanner({ msg }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
      <AlertCircle size={16} className="text-red-400 shrink-0" />
      <p className="text-sm text-red-500 font-medium">{msg}</p>
    </div>
  );
}
