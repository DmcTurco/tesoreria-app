import { useEffect, useState, useCallback } from "react";
import { Plus, Search, X, Loader2, Ban } from "lucide-react";
import api from "../../api/client";
import { PAGO_ESTADO, PAGO_ESTADO_LABEL } from "../../constants/estados";

export default function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [padres, setPadres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.get("/pagos"), api.get("/padres")])
      .then(([rP, rPa]) => {
        setPagos(rP.data);
        setPadres(rPa.data);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleAnular = async (id) => {
    if (!confirm("¿Anular este pago?")) return;
    try {
      await api.put(`/pagos/${id}/anular`);
      showToast("Pago anulado");
      load();
    } catch (e) {
      showToast(e.response?.data?.message ?? "Error", "err");
    }
  };

  const filtrados = pagos.filter((p) => {
    const nombre = padres.find((pa) => pa.id === p.padre_id)?.nombre ?? "";
    const matchSearch =
      nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.concepto.toLowerCase().includes(search.toLowerCase());
    const matchEstado =
      filtroEstado === "" || p.estado === Number(filtroEstado);
    return matchSearch && matchEstado;
  });

  return (
    <div className="flex flex-col gap-5">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-stone-800">Pagos</h1>
          <p className="text-sm text-stone-400">
            {pagos.filter((p) => p.estado === PAGO_ESTADO.PAGADO).length}{" "}
            cobrados
          </p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Registrar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            className="w-full h-10 pl-8 pr-3 bg-white border border-stone-200 rounded-xl text-sm outline-none focus:border-amber-400 transition-colors"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="h-10 px-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-600 outline-none focus:border-amber-400"
        >
          <option value="">Todos</option>
          <option value="0">Pendiente</option>
          <option value="1">Pagado</option>
          <option value="2">Anulado</option>
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        {loading ? (
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
                  <EstadoBadge
                    estado={p.estado}
                    map={PAGO_ESTADO_LABEL}
                    colors={PAGO_COLORS}
                  />
                  {p.estado === PAGO_ESTADO.PAGADO && (
                    <button
                      onClick={() => handleAnular(p.id)}
                      className="text-stone-300 hover:text-red-400 transition-colors ml-1"
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

      {modal && (
        <ModalNuevoPago
          padres={padres}
          onClose={() => setModal(false)}
          onSaved={() => {
            load();
            showToast("Pago registrado");
            setModal(false);
          }}
          onError={(msg) => showToast(msg, "err")}
        />
      )}
    </div>
  );
}

function ModalNuevoPago({ padres, onClose, onSaved, onError }) {
  const [form, setForm] = useState({
    padre_id: "",
    concepto: "",
    monto: "",
    fecha: today(),
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.padre_id || !form.concepto || !form.monto) {
      onError("Completa todos los campos");
      return;
    }
    setLoading(true);
    try {
      await api.post("/pagos", form);
      onSaved();
    } catch (e) {
      onError(e.response?.data?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal titulo="Registrar pago" onClose={onClose}>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-stone-600">
          Padre / Madre
        </label>
        <select
          value={form.padre_id}
          onChange={set("padre_id")}
          className="h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400"
        >
          <option value="">Seleccionar...</option>
          {padres.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} — {p.hijo}
            </option>
          ))}
        </select>
      </div>
      <Field
        label="Concepto"
        value={form.concepto}
        onChange={set("concepto")}
        placeholder="Ej: Mantenimiento 2025"
      />
      <Field
        label="Monto (S/)"
        type="number"
        value={form.monto}
        onChange={set("monto")}
        placeholder="50.00"
      />
      <Field
        label="Fecha"
        type="date"
        value={form.fecha}
        onChange={set("fecha")}
      />
      <BtnPrimary onClick={handleSave} loading={loading}>
        Guardar pago
      </BtnPrimary>
    </Modal>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────
const PAGO_COLORS = {
  0: "bg-yellow-50 text-yellow-700",
  1: "bg-emerald-50 text-emerald-700",
  2: "bg-stone-100 text-stone-500",
};

function EstadoBadge({ estado, map, colors }) {
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${colors[estado] ?? "bg-stone-100 text-stone-500"}`}
    >
      {map[estado] ?? "—"}
    </span>
  );
}

function Modal({ titulo, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 sticky top-0 bg-white">
          <p className="font-black text-stone-800 text-sm">{titulo}</p>
          <button onClick={onClose}>
            <X size={18} className="text-stone-400" />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-3">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-stone-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400 transition-colors"
      />
    </div>
  );
}

function BtnPrimary({ children, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 mt-1"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : children}
    </button>
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
