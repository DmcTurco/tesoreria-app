import { useEffect, useState } from "react";
import { Plus, Search, Ban, Loader2, AlertCircle } from "lucide-react";
import { useAbono } from "../../hook/useAbono";
import { usePadres } from "../../hook/usePadres";
import ModalAnulacion from "./../../constants/ModalAnulacion";
import ModalAbono from "../../constants/ModalAbono";
import { formatFecha, Toast } from "./../../utils/utility";

const TIPO_COLORS = {
  multa: "bg-red-50 text-red-600",
  cobro: "bg-blue-50 text-blue-600",
};

const ESTADO_COLORS = {
  0: "bg-emerald-50 text-emerald-700", // activo
  1: "bg-stone-100 text-stone-400", // anulado
};

const ESTADO_LABELS = {
  0: "Activo",
  1: "Anulado",
};

export default function Pagos() {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [abonoAAnular, setAbonoAAnular] = useState(null);

  const { loading, error, abonos, getAbonos, anularAbono } = useAbono();
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

  const filtrados = abonos.filter((a) => {
    if (!search) return true;
    const padre = padres.find((p) => p.id === a.padre_id);
    return (
      padre?.nombre?.toLowerCase().includes(search.toLowerCase()) ||
      a.tipo_deuda?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col gap-5">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-stone-800">Abonos</h1>
          <p className="text-sm text-stone-400">
            Registro de cobros realizados
          </p>
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

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-stone-100">
        {loading || loadingPadres ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="text-amber-400 animate-spin" />
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-10">
            Sin resultados
          </p>
        ) : (
          <div className="divide-y divide-stone-50">
            {filtrados.map((a) => {
              const padre = padres.find((p) => p.id === a.padre_id);
              return (
                <div key={a.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-700 truncate">
                      {padre?.nombre ?? a.padre?.nombre ?? "—"}
                    </p>
                    <p className="text-xs text-stone-400 truncate">
                      {formatFecha(a.fecha)}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-stone-700 shrink-0">
                    S/ {Number(a.monto).toFixed(2)}
                  </span>
                  {/* Tipo de deuda */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${TIPO_COLORS[a.tipo_deuda] ?? "bg-stone-100 text-stone-500"}`}
                  >
                    {a.tipo_deuda}
                  </span>
                  {/* Estado */}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${ESTADO_COLORS[a.estado]}`}
                  >
                    {ESTADO_LABELS[a.estado]}
                  </span>
                  {/* Anular solo si está activo */}
                  {Number(a.estado) === 0 && (
                    <button
                      onClick={() => handleAnular(a)}
                      className="text-stone-300 hover:text-red-400 transition-colors"
                      title="Anular abono"
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

      {/* Modal registrar abono */}
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

function ErrorBanner({ msg }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
      <AlertCircle size={16} className="text-red-400 shrink-0" />
      <p className="text-sm text-red-500 font-medium">{msg}</p>
    </div>
  );
}
