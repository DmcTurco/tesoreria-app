import { useEffect, useState } from "react";
import { Plus, Search, X, Loader2, Ban, AlertCircle } from "lucide-react";
import { usePagos } from "../../hook/usePagos";
import { usePadres } from "../../hook/usePadres";
import useApi from "../../hook/useApi";
import { PAGO_ESTADO, PAGO_ESTADO_LABEL } from "../../constants/estados";
import ModalAnulacion from "./../../constants/ModalAnulacion"; // ← importar modal
import ModalAbono from "../../constants/ModalAbono";
import {formatFecha, Toast} from  "./../../utils/utility";

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

  const reload = () => getPagos({ estado: filtroEstado !== "" ? Number(filtroEstado) : null });

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



// ── Atoms ─────────────────────────────────────────────────────────────────────
function ErrorBanner({ msg }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
      <AlertCircle size={16} className="text-red-400 shrink-0" />
      <p className="text-sm text-red-500 font-medium">{msg}</p>
    </div>
  );
}