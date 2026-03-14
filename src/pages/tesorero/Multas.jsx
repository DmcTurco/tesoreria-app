import { useEffect, useState } from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { useMultas } from "../../hook/useMultas";
import { MULTA_ESTADO, MULTA_ESTADO_LABEL } from "../../constants/estados";

const COLORS = {
  0: "bg-yellow-50 text-yellow-700",
  1: "bg-emerald-50 text-emerald-700",
  2: "bg-blue-50 text-blue-600",
  3: "bg-stone-100 text-stone-400",
};

export default function Multas() {
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("");
  const [modal, setModal] = useState(null); // { type: "exonerar", multa }
  const [toast, setToast] = useState(null);

  const { loading, error, multas, getMultas, pagarMulta, exonerarMulta } =
    useMultas();

  // Carga al montar y cuando cambia el filtro de estado
  useEffect(() => {
    getMultas({ estado: filtro !== "" ? Number(filtro) : null });
  }, [filtro]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const reload = () =>
    getMultas({ estado: filtro !== "" ? Number(filtro) : null });

  const handlePagar = async (multa) => {
    try {
      await pagarMulta(multa.id);
      showToast("Multa cobrada y registrada como ingreso");
      reload();
    } catch (e) {
      showToast(e.message ?? "Error", "err");
    }
  };

  const filtradas = multas.filter((m) => {
    const nombre = m.padre?.nombre ?? "";
    return (
      nombre.toLowerCase().includes(search.toLowerCase()) ||
      m.concepto.toLowerCase().includes(search.toLowerCase())
    );
  });

  const pendientesTotal = multas
    .filter((m) => m.estado === MULTA_ESTADO.PENDIENTE)
    .reduce((s, m) => s + Number(m.monto), 0);

  return (
    <div className="flex flex-col gap-5">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-stone-800">Multas</h1>
          <p className="text-sm text-stone-400">
            S/ {pendientesTotal.toFixed(2)} pendientes de cobro
          </p>
        </div>
      </div>

      {/* Error de API */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* Banner pendientes */}
      {pendientesTotal > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <AlertTriangle size={18} className="text-orange-400 shrink-0" />
          <p className="text-sm text-orange-700 font-semibold">
            Hay {multas.filter((m) => m.estado === 0).length} multas por cobrar
            por un total de S/ {pendientesTotal.toFixed(2)}
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-36">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o concepto..."
            className="w-full h-10 pl-8 pr-3 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-400"
          />
        </div>
        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="h-10 px-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-600 outline-none focus:border-amber-400"
        >
          <option value="">Todos</option>
          <option value="0">Pendiente</option>
          <option value="1">Pagado</option>
          <option value="2">Exonerado</option>
          <option value="3">Anulado</option>
        </select>
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="text-amber-400 animate-spin" />
          </div>
        ) : filtradas.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-10">Sin multas</p>
        ) : (
          filtradas.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-700 truncate">
                  {m.padre?.nombre ?? "—"}
                </p>
                <p className="text-xs text-stone-400 truncate">{m.concepto}</p>
              </div>
              <span className="text-sm font-bold text-stone-700 shrink-0">
                S/ {Number(m.monto).toFixed(2)}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${COLORS[m.estado]}`}
              >
                {MULTA_ESTADO_LABEL[m.estado]}
              </span>
              {m.estado === MULTA_ESTADO.PENDIENTE && (
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handlePagar(m)}
                    className="w-7 h-7 rounded-full bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                    title="Cobrar"
                  >
                    <CheckCircle size={15} className="text-emerald-500" />
                  </button>
                  <button
                    onClick={() => setModal({ type: "exonerar", multa: m })}
                    className="w-7 h-7 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-colors"
                    title="Exonerar"
                  >
                    <XCircle size={15} className="text-blue-400" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {modal?.type === "exonerar" && (
        <ModalExonerar
          multa={modal.multa}
          exonerarMulta={exonerarMulta}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            showToast("Multa exonerada");
            reload();
          }}
          onError={(msg) => showToast(msg, "err")}
        />
      )}
    </div>
  );
}

// ── Modal exonerar ────────────────────────────────────────────────────────────
function ModalExonerar({ multa, exonerarMulta, onClose, onSaved, onError }) {
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!motivo) {
      onError("Ingresa el motivo de exoneración");
      return;
    }
    setLoading(true);
    try {
      await exonerarMulta(multa.id, motivo);
      onSaved();
    } catch (e) {
      onError(e.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <p className="font-black text-stone-800 text-sm">Exonerar multa</p>
          <button onClick={onClose}>
            <X size={18} className="text-stone-400 hover:text-stone-600" />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <p className="text-xs text-stone-500">
            <span className="font-bold">{multa.padre?.nombre}</span> —{" "}
            {multa.concepto} (S/ {Number(multa.monto).toFixed(2)})
          </p>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-stone-600">
              Motivo de exoneración
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej: Justificó ausencia por salud..."
              className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400 resize-none h-24"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="h-11 bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Confirmar exoneración"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Atom ──────────────────────────────────────────────────────────────────────
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
