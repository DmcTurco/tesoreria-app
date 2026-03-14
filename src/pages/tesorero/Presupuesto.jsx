import { useEffect, useState } from "react";
import { Plus, Loader2, X, Trash2, PiggyBank, AlertCircle } from "lucide-react";
import { usePresupuesto } from "./../../hook/usePresupuesto";
// import { usePresupuesto } from "../hooks/usePresupuesto";

export default function Presupuesto() {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [modal, setModal] = useState(false);
  const [toast, setToast] = useState(null);

  const {
    loading,
    error,
    presupuestos,
    gastosReales,
    getPresupuestos,
    createPresupuesto,
    deletePresupuesto,
  } = usePresupuesto();

  useEffect(() => {
    getPresupuestos({ anio });
  }, [anio]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Eliminar este presupuesto?")) return;
    try {
      await deletePresupuesto(id);
      showToast("Presupuesto eliminado");
      getPresupuestos({ anio });
    } catch (e) {
      showToast(e.message ?? "Error al eliminar", "err");
    }
  };

  const totalPlanificado = presupuestos.reduce(
    (s, p) => s + Number(p.monto_planificado),
    0,
  );

  return (
    <div className="flex flex-col gap-5">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-stone-800">Presupuesto</h1>
          <p className="text-sm text-stone-400">
            S/ {totalPlanificado.toFixed(2)} planificado
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="h-9 px-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-600 outline-none focus:border-amber-400"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={() => setModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
          >
            <Plus size={15} /> Agregar
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="text-amber-400 animate-spin" />
        </div>
      )}

      {!loading && !error && presupuestos.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 flex flex-col items-center py-12 gap-3">
          <PiggyBank size={36} className="text-stone-200" />
          <p className="text-stone-400 text-sm">Sin presupuesto para {anio}</p>
          <button
            onClick={() => setModal(true)}
            className="text-amber-500 text-sm font-semibold hover:underline"
          >
            Crear primer presupuesto
          </button>
        </div>
      )}

      {!loading && presupuestos.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50">
          {presupuestos.map((p) => {
            const real = Number(gastosReales[p.categoria] ?? 0);
            const plan = Number(p.monto_planificado);
            const pct = plan > 0 ? Math.min((real / plan) * 100, 100) : 0;
            const overBudget = real > plan;
            return (
              <div key={p.id} className="px-4 py-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold text-stone-700">
                      {p.categoria}
                    </p>
                    {p.descripcion && (
                      <p className="text-xs text-stone-400">{p.descripcion}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-black text-stone-800">
                        S/ {plan.toFixed(2)}
                      </p>
                      <p
                        className={`text-xs font-medium ${overBudget ? "text-red-400" : "text-stone-400"}`}
                      >
                        Real: S/ {real.toFixed(2)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-stone-200 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${overBudget ? "bg-red-400" : "bg-amber-400"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p
                  className={`text-[10px] mt-1 font-medium ${overBudget ? "text-red-400" : "text-stone-400"}`}
                >
                  {pct.toFixed(0)}% ejecutado {overBudget ? "⚠️ Excedido" : ""}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <ModalNuevoPresupuesto
          anio={anio}
          createPresupuesto={createPresupuesto}
          onClose={() => setModal(false)}
          onSaved={() => {
            setModal(false);
            showToast("Guardado");
            getPresupuestos({ anio });
          }}
          onError={(msg) => showToast(msg, "err")}
        />
      )}
    </div>
  );
}

function ModalNuevoPresupuesto({
  anio,
  createPresupuesto,
  onClose,
  onSaved,
  onError,
}) {
  const [form, setForm] = useState({
    anio,
    mes: "",
    categoria: "",
    descripcion: "",
    monto_planificado: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.categoria || !form.monto_planificado) {
      onError("Completa categoría y monto");
      return;
    }
    setLoading(true);
    try {
      await createPresupuesto({
        ...form,
        mes: form.mes ? Number(form.mes) : null,
      });
      onSaved();
    } catch (e) {
      onError(e.message ?? "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <p className="font-black text-stone-800 text-sm">Nuevo presupuesto</p>
          <button onClick={onClose}>
            <X size={18} className="text-stone-400 hover:text-stone-600" />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <Field
            label="Categoría *"
            value={form.categoria}
            onChange={set("categoria")}
            placeholder="Ej: Mantenimiento"
          />
          <Field
            label="Descripción"
            value={form.descripcion}
            onChange={set("descripcion")}
            placeholder="Opcional"
          />
          <div className="grid grid-cols-2 gap-2">
            <Field
              label="Año"
              type="number"
              value={form.anio}
              onChange={set("anio")}
            />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-stone-600">
                Mes (opcional)
              </label>
              <select
                value={form.mes}
                onChange={set("mes")}
                className="h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400"
              >
                <option value="">Anual</option>
                {[
                  "Ene",
                  "Feb",
                  "Mar",
                  "Abr",
                  "May",
                  "Jun",
                  "Jul",
                  "Ago",
                  "Sep",
                  "Oct",
                  "Nov",
                  "Dic",
                ].map((m, i) => (
                  <option key={i + 1} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Field
            label="Monto planificado (S/) *"
            type="number"
            value={form.monto_planificado}
            onChange={set("monto_planificado")}
            placeholder="0.00"
          />
          <button
            onClick={handleSave}
            disabled={loading}
            className="h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 mt-1"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Guardar"
            )}
          </button>
        </div>
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
