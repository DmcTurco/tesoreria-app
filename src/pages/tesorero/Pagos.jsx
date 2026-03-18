import { useEffect, useState } from "react";
import { Plus, Search, X, Loader2, Ban, AlertCircle } from "lucide-react";
import { usePagos } from "../../hook/usePagos";
import { usePadres } from "../../hook/usePadres";
import useApi from "../../hook/useApi";
import { PAGO_ESTADO, PAGO_ESTADO_LABEL } from "../../constants/estados";
import ModalAnulacion from "./../../constants/ModalAnulacion"; // ← importar modal
import PadreBuscador from "../../constants/PadreBuscador";
import ModalAbono from "../../constants/ModalAbono";

const PAGO_COLORS = {
  0: "bg-yellow-50 text-yellow-700",
  1: "bg-emerald-50 text-emerald-700",
  2: "bg-stone-100 text-stone-500",
};

export default function Pagos() {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  <div className="flex flex-col gap-1.5"></div>;
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [pagoAAnular, setPagoAAnular] = useState(null); // ← nuevo estado

  const {
    loading: loadingPagos,
    error,
    pagos,
    getPagos,
    createPago,
  } = usePagos();
  const { loading: loadingPadres, padres, getPadres } = usePadres();

  useEffect(() => {
    getPagos();
    getPadres();
  }, []);

  useEffect(() => {
    getPagos({ estado: filtroEstado !== "" ? Number(filtroEstado) : null });
  }, [filtroEstado]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const reload = () =>
    getPagos({ estado: filtroEstado !== "" ? Number(filtroEstado) : null });

  // ← Ahora solo abre el modal con los datos del pago + nombre del padre
  const handleAnular = (p) => {
    const padre = padres.find((pa) => pa.id === p.padre_id);
    setPagoAAnular({
      ...p,
      padre_nombre: padre?.nombre ?? "—",
    });
  };

  const filtrados = pagos.filter((p) => {
    if (!search) return true;
    const padre = padres.find((pa) => pa.id === p.padre_id);
    return (
      padre?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      p.concepto?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col gap-5">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-stone-800">Pagos</h1>
          <p className="text-sm text-stone-400">Registro de cobros y cuotas</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Registrar
        </button>
      </div>

      {error && <ErrorBanner msg={error} />}

      {/* Buscador + filtro */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por padre o concepto..."
            className="w-full h-9 pl-8 pr-3 bg-white border border-stone-200 rounded-xl text-xs text-stone-700 outline-none focus:border-amber-400"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="h-9 px-3 bg-white border border-stone-200 rounded-xl text-xs text-stone-600 outline-none focus:border-amber-400"
        >
          <option value="">Todos</option>
          <option value="0">Pendientes</option>
          <option value="1">Pagados</option>
          <option value="2">Anulados</option>
        </select>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-stone-100">
        {loadingPagos || loadingPadres ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="text-amber-400 animate-spin" />
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-10">
            Sin resultados
          </p>
        ) : (
          <div className="divide-y divide-stone-50">
            {filtrados.map((p) => {
              const padre = padres.find((pa) => pa.id === p.padre_id);
              return (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-700 truncate">
                      {padre?.nombre ?? "—"}
                    </p>
                    <p className="text-xs text-stone-400 truncate">
                      {p.concepto} · {formatFecha(p.fecha)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-stone-700 shrink-0">
                    S/ {Number(p.monto).toFixed(2)}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${PAGO_COLORS[p.estado]}`}
                  >
                    {PAGO_ESTADO_LABEL[p.estado]}
                  </span>
                  {p.estado === PAGO_ESTADO.PAGADO && (
                    <button
                      onClick={() => handleAnular(p)} // ← pasa el objeto completo
                      className="text-stone-300 hover:text-red-400 transition-colors"
                      title="Anular pago"
                    >
                      <Ban size={15} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal registrar pago */}
      {modal && (
        <ModalAbono
          onClose={() => setModal(false)}
          onSuccess={(msg) => {
            showToast(msg);
            reload();
          }}
          onError={(msg) => showToast(msg, "err")}
        />
        // <ModalNuevoPago
        //   padres={padres}
        //   createPago={createPago}
        //   onClose={() => setModal(false)}
        //   onSaved={() => {
        //     setModal(false);
        //     showToast("Pago registrado");
        //     reload();
        //   }}
        //   onError={(msg) => showToast(msg, "err")}
        // />
      )}

      {/* Modal anular pago */}
      <ModalAnulacion
        pago={pagoAAnular}
        onClose={() => setPagoAAnular(null)}
        onSuccess={(msg) => {
          showToast(msg);
          reload();
        }}
      />
    </div>
  );
}

// ── Modal registrar pago ──────────────────────────────────────────────────────
function ModalNuevoPago({ padres, createPago, onClose, onSaved, onError }) {
  const [padreId, setPadreId] = useState("");
  const [concepto, setConcepto] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(today());
  const [pendientes, setPendientes] = useState([]);
  const [loadingPend, setLoadingPend] = useState(false);
  const [itemSel, setItemSel] = useState(null);
  const [loading, setLoading] = useState(false);
  const api = useApi();

  useEffect(() => {
    if (!padreId) {
      setPendientes([]);
      setItemSel(null);
      setConcepto("");
      setMonto("");
      return;
    }
    setLoadingPend(true);
    api
      .get("/mi-estado-tesorero", { params: { padre_id: padreId } })
      .then((r) => {
        const items = [];
        (r.multas ?? [])
          .filter((m) => m.estado === 0)
          .forEach((m) => {
            items.push({
              tipo: "multa",
              id: m.id,
              label: `Multa: ${m.concepto}`,
              monto: Number(m.monto),
              ref_id: m.id,
            });
          });
        (r.cobros ?? [])
          .filter((ep) => ep.estado === 0)
          .forEach((ep) => {
            items.push({
              tipo: "cobro",
              id: `cobro-${ep.id}`,
              label: `Cobro: ${ep.evento?.titulo ?? "—"}`,
              monto: Number(ep.evento?.multa_monto ?? 0),
              ref_id: ep.id,
            });
          });
        setPendientes(items);
      })
      .catch(() => setPendientes([]))
      .finally(() => setLoadingPend(false));
  }, [padreId]);

  const handleSelItem = (item) => {
    if (itemSel?.id === item.id) {
      setItemSel(null);
      setConcepto("");
      setMonto("");
    } else {
      setItemSel(item);
      setConcepto(item.label);
      setMonto(String(item.monto));
    }
  };

  const handleSave = async () => {
    if (!padreId || !concepto || !monto) {
      onError("Completa todos los campos");
      return;
    }
    setLoading(true);
    try {
      await createPago({
        padre_id: Number(padreId),
        concepto,
        monto: Number(monto),
        fecha,
      });
      if (itemSel?.tipo === "multa") {
        await api.post(`/multas/${itemSel.ref_id}/pagar`);
      }
      if (itemSel?.tipo === "cobro") {
        await api.put(`/evento-padres/${itemSel.ref_id}/pagar`);
      }
      onSaved();
    } catch (e) {
      onError(e.message ?? "Error al registrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 sticky top-0 bg-white">
          <p className="font-black text-stone-800 text-sm">Registrar pago</p>
          <button onClick={onClose}>
            <X size={18} className="text-stone-400 hover:text-stone-600" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* 1. Seleccionar padre */}
          <PadreBuscador
            value={padreId}
            onChange={(id) => setPadreId(id ? String(id) : "")}
          />

          {/* 2. Pendientes del padre */}
          {padreId && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-600">
                ¿Por qué concepto?{" "}
                <span className="font-normal text-stone-400">(opcional)</span>
              </label>
              {loadingPend ? (
                <div className="flex justify-center py-3">
                  <Loader2 size={18} className="text-amber-400 animate-spin" />
                </div>
              ) : pendientes.length === 0 ? (
                <p className="text-xs text-stone-400 bg-stone-50 rounded-xl px-3 py-2.5">
                  Este padre no tiene cobros ni multas pendientes
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {pendientes.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelItem(item)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all
                        ${
                          itemSel?.id === item.id
                            ? "border-amber-400 bg-amber-50"
                            : "border-stone-200 bg-stone-50 hover:border-amber-200"
                        }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full shrink-0
                        ${item.tipo === "multa" ? "bg-red-400" : "bg-orange-400"}`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-stone-700 truncate">
                          {item.label}
                        </p>
                        <p className="text-[10px] text-stone-400">
                          {item.tipo === "multa"
                            ? "Multa por ausencia"
                            : "Cobro de evento"}
                        </p>
                      </div>
                      <span className="text-sm font-black text-stone-700 shrink-0">
                        S/ {item.monto.toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. Concepto y monto */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-600">Concepto</label>
            <input
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Ej: Mantenimiento aula 2025"
              className="h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-600">
                Monto (S/)
              </label>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="0.00"
                className="h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-600">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400 transition-colors"
              />
            </div>
          </div>

          {itemSel && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              <p className="text-xs text-amber-700 font-semibold">
                ✓ Al guardar también se marcará como <strong>pagado</strong> el
                concepto seleccionado
              </p>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className="h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Guardar pago"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Atoms ─────────────────────────────────────────────────────────────────────
function ErrorBanner({ msg }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
      <AlertCircle size={16} className="text-red-400 shrink-0" />
      <p className="text-sm text-red-500 font-medium">{msg}</p>
    </div>
  );
}

function Toast({ msg, type }) {
  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg
      ${type === "err" ? "bg-red-500 text-white" : "bg-stone-800 text-white"}`}
    >
      {msg}
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

function today() {
  return new Date().toISOString().slice(0, 10);
}
