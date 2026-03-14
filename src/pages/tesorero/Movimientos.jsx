import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Loader2,
  X,
  Trash2,
} from "lucide-react";
import api from "../../api/client";
import {
  MOVIMIENTO_TIPO,
  MOVIMIENTO_TIPO_LABEL,
} from "../../constants/estados";

const CATEGORIAS = [
  "Cuota / Pago",
  "Multa",
  "Mantenimiento",
  "Materiales",
  "Eventos",
  "Servicios",
  "Otros",
];

export default function Movimientos() {
  const [data, setData] = useState({
    data: [],
    total_ingresos: 0,
    total_egresos: 0,
    saldo: 0,
  });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = filtroTipo !== "" ? { tipo: filtroTipo } : {};
    api
      .get("/movimientos", { params })
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [filtroTipo]);

  useEffect(() => {
    load();
  }, [load]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este movimiento?")) return;
    try {
      await api.delete(`/movimientos/${id}`);
      load();
      showToast("Eliminado");
    } catch (e) {
      showToast(e.response?.data?.message ?? "Error", "err");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

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

      {/* Resumen del período */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-emerald-50 rounded-2xl p-4 text-center">
          <TrendingUp size={18} className="text-emerald-500 mx-auto mb-1" />
          <p className="text-lg font-black text-emerald-700">
            S/ {Number(data.total_ingresos).toFixed(2)}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium">Ingresos</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 text-center">
          <TrendingDown size={18} className="text-red-400 mx-auto mb-1" />
          <p className="text-lg font-black text-red-500">
            S/ {Number(data.total_egresos).toFixed(2)}
          </p>
          <p className="text-[11px] text-red-400 font-medium">Egresos</p>
        </div>
        <div
          className={`rounded-2xl p-4 text-center ${data.saldo >= 0 ? "bg-amber-50" : "bg-orange-50"}`}
        >
          <p className="text-[11px] font-medium text-stone-400 mb-1">Saldo</p>
          <p
            className={`text-lg font-black ${data.saldo >= 0 ? "text-amber-700" : "text-orange-600"}`}
          >
            S/ {Number(data.saldo).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filtro tipo */}
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
              ${filtroTipo === v ? "bg-amber-500 text-white" : "bg-white border border-stone-200 text-stone-500 hover:border-amber-300"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="text-amber-400 animate-spin" />
          </div>
        ) : (data.data ?? []).length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-10">
            Sin movimientos
          </p>
        ) : (
          (data.data ?? []).map((m) => (
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
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-700 truncate">
                  {m.descripcion}
                </p>
                <p className="text-xs text-stone-400">
                  {m.categoria} · {formatFecha(m.fecha)}
                </p>
              </div>
              <span
                className={`text-sm font-bold shrink-0 ${m.tipo === MOVIMIENTO_TIPO.INGRESO ? "text-emerald-600" : "text-red-500"}`}
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

      {modal && (
        <ModalNuevoMovimiento
          onClose={() => setModal(false)}
          onSaved={() => {
            load();
            setModal(false);
            showToast("Movimiento registrado");
          }}
          onError={(msg) => showToast(msg, "err")}
        />
      )}
    </div>
  );
}

function ModalNuevoMovimiento({ onClose, onSaved, onError }) {
  const [form, setForm] = useState({
    tipo: "0",
    monto: "",
    descripcion: "",
    categoria: "Otros",
    fecha: today(),
    comprobante: "",
    observaciones: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.monto || !form.descripcion) {
      onError("Completa monto y descripción");
      return;
    }
    setLoading(true);
    try {
      await api.post("/movimientos", { ...form, tipo: Number(form.tipo) });
      onSaved();
    } catch (e) {
      onError(e.response?.data?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal titulo="Nuevo movimiento" onClose={onClose}>
      <div className="flex bg-stone-100 rounded-xl p-1 gap-1 mb-1">
        {[
          ["0", "Ingreso"],
          ["1", "Egreso"],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setForm((p) => ({ ...p, tipo: v }))}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all
              ${form.tipo === v ? (v === "0" ? "bg-emerald-500 text-white" : "bg-red-500 text-white") : "text-stone-500"}`}
          >
            {l}
          </button>
        ))}
      </div>
      <Field
        label="Monto (S/)"
        type="number"
        value={form.monto}
        onChange={set("monto")}
        placeholder="0.00"
      />
      <Field
        label="Descripción"
        value={form.descripcion}
        onChange={set("descripcion")}
        placeholder="Ej: Cobro cuota mantenimiento"
      />
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold text-stone-600">Categoría</label>
        <select
          value={form.categoria}
          onChange={set("categoria")}
          className="h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400"
        >
          {CATEGORIAS.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <Field
        label="Fecha"
        type="date"
        value={form.fecha}
        onChange={set("fecha")}
      />
      <Field
        label="Comprobante (opcional)"
        value={form.comprobante}
        onChange={set("comprobante")}
        placeholder="Nº boleta o recibo"
      />
      <BtnPrimary onClick={handleSave} loading={loading}>
        Guardar
      </BtnPrimary>
    </Modal>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────
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
