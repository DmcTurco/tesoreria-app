import { useEffect, useState } from "react";
import {
  Plus,
  CalendarDays,
  ChevronRight,
  Loader2,
  X,
  CheckSquare,
  AlertCircle,
} from "lucide-react";
import { useEventos } from "../../hook/useEventos";
import { EVENTO_TIPO_LABEL, EVENTO_ESTADO } from "../../constants/estados";

const TIPO_COLORS = {
  0: "bg-amber-50 text-amber-700",
  1: "bg-orange-50 text-orange-600",
  2: "bg-blue-50 text-blue-600",
  3: "bg-emerald-50 text-emerald-700",
  4: "bg-purple-50 text-purple-600",
};

export default function Eventos() {
  const [modal, setModal] = useState(null); // "nuevo" | evento_obj
  const [toast, setToast] = useState(null);

  const { loading, error, eventos, getEventos, createEvento, cerrarEvento } =
    useEventos();

  useEffect(() => {
    getEventos();
  }, []);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleCerrar = async (evento) => {
    if (
      !confirm(
        `¿Cerrar el evento "${evento.titulo}"? Se generarán multas a los ausentes.`,
      )
    )
      return;
    try {
      await cerrarEvento(evento.id);
      showToast("Evento cerrado y multas generadas");
      getEventos();
    } catch (e) {
      showToast(e.message ?? "Error", "err");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-stone-800">Eventos</h1>
          <p className="text-sm text-stone-400">
            {eventos.filter((e) => e.estado === EVENTO_ESTADO.ACTIVO).length}{" "}
            activos
          </p>
        </div>
        <button
          onClick={() => setModal("nuevo")}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Nuevo evento
        </button>
      </div>

      {/* Error de API */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={24} className="text-amber-400 animate-spin" />
          </div>
        ) : eventos.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-10">
            Sin eventos
          </p>
        ) : (
          eventos.map((e) => (
            <div key={e.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarDays size={18} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLORS[e.tipo]}`}
                    >
                      {EVENTO_TIPO_LABEL[e.tipo]}
                    </span>
                    {e.estado === EVENTO_ESTADO.CERRADO && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-400">
                        Cerrado
                      </span>
                    )}
                    {e.tiene_multa && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-400">
                        Multa S/{e.multa_monto}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-stone-700">{e.titulo}</p>
                  <p className="text-xs text-stone-400">
                    {formatFecha(e.fecha_inicio)}
                    {e.fecha_fin
                      ? ` → ${formatFecha(e.fecha_fin)}`
                      : " (sin fecha límite)"}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {e.estado === EVENTO_ESTADO.ACTIVO && e.tipo !== 3 && (
                    <button
                      onClick={() => handleCerrar(e)}
                      className="w-8 h-8 rounded-full bg-stone-50 hover:bg-amber-50 flex items-center justify-center transition-colors"
                      title="Cerrar evento"
                    >
                      <CheckSquare
                        size={15}
                        className="text-stone-400 hover:text-amber-500"
                      />
                    </button>
                  )}
                  <button
                    onClick={() => setModal(e)}
                    className="w-8 h-8 rounded-full bg-stone-50 hover:bg-stone-100 flex items-center justify-center transition-colors"
                  >
                    <ChevronRight size={15} className="text-stone-400" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {modal === "nuevo" && (
        <ModalNuevoEvento
          createEvento={createEvento}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            showToast("Evento creado");
            getEventos();
          }}
          onError={(msg) => showToast(msg, "err")}
        />
      )}
    </div>
  );
}

// ── Modal nuevo evento ────────────────────────────────────────────────────────
function ModalNuevoEvento({ createEvento, onClose, onSaved, onError }) {
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    tipo: "1",
    fecha_inicio: today(),
    fecha_fin: "",
    hora_inicio: "07:00",
    hora_fin: "18:00",
    tiene_multa: false,
    multa_monto: "10",
    lugar: "",
    padres_por_dia: "",
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const isGuardia = form.tipo === "0";
  const isCobro = form.tipo === "3";

  const handleSave = async () => {
    if (!form.titulo) {
      onError("Ingresa el título del evento");
      return;
    }
    setLoading(true);
    try {
      await createEvento({
        ...form,
        tipo: Number(form.tipo),
        tiene_multa: form.tiene_multa,
        multa_monto: Number(form.multa_monto),
        fecha_fin: form.fecha_fin || null,
        hora_inicio: isCobro ? null : form.hora_inicio,
        hora_fin: isCobro ? null : form.hora_fin,
        padres_por_dia:
          isGuardia && form.padres_por_dia ? Number(form.padres_por_dia) : null,
      });
      onSaved();
    } catch (e) {
      onError(e.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 sticky top-0 bg-white">
          <p className="font-black text-stone-800 text-sm">Nuevo evento</p>
          <button onClick={onClose}>
            <X size={18} className="text-stone-400 hover:text-stone-600" />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-3">
          {/* Tipo */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-stone-600">Tipo</label>
            <select
              value={form.tipo}
              onChange={set("tipo")}
              className="h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400"
            >
              {Object.entries(EVENTO_TIPO_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <Field
            label="Título *"
            value={form.titulo}
            onChange={set("titulo")}
            placeholder="Ej: Guardia escolar 3°A"
          />
          <Field
            label="Descripción"
            value={form.descripcion}
            onChange={set("descripcion")}
            placeholder="Opcional..."
          />
          <Field
            label="Lugar"
            value={form.lugar}
            onChange={set("lugar")}
            placeholder="Ej: Puerta principal"
          />

          <div className="grid grid-cols-2 gap-2">
            <Field
              label="Fecha inicio *"
              type="date"
              value={form.fecha_inicio}
              onChange={set("fecha_inicio")}
            />
            <Field
              label={isCobro ? "Fecha fin (opcional)" : "Fecha fin"}
              type="date"
              value={form.fecha_fin}
              onChange={set("fecha_fin")}
            />
          </div>

          {!isCobro && (
            <div className="grid grid-cols-2 gap-2">
              <Field
                label="Hora inicio"
                type="time"
                value={form.hora_inicio}
                onChange={set("hora_inicio")}
              />
              <Field
                label="Hora fin"
                type="time"
                value={form.hora_fin}
                onChange={set("hora_fin")}
              />
            </div>
          )}

          {isGuardia && (
            <Field
              label="Padres por día"
              type="number"
              value={form.padres_por_dia}
              onChange={set("padres_por_dia")}
              placeholder="Ej: 4"
            />
          )}

          {/* Multa */}
          <div className="flex items-center gap-3 bg-stone-50 rounded-xl px-3 py-2.5">
            <input
              type="checkbox"
              id="tiene_multa"
              checked={form.tiene_multa}
              onChange={(e) =>
                setForm((p) => ({ ...p, tiene_multa: e.target.checked }))
              }
              className="w-4 h-4 accent-amber-500"
            />
            <label
              htmlFor="tiene_multa"
              className="text-xs font-semibold text-stone-600 cursor-pointer flex-1"
            >
              Genera multa por ausencia
            </label>
            {form.tiene_multa && (
              <input
                type="number"
                value={form.multa_monto}
                onChange={set("multa_monto")}
                className="w-20 h-8 px-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-700 outline-none focus:border-amber-400 text-right"
                placeholder="10"
              />
            )}
          </div>

          {isCobro && (
            <div className="bg-blue-50 rounded-xl px-3 py-2.5 text-xs text-blue-600 font-medium">
              Los cobros se asignan automáticamente a todos los padres
              registrados.
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className="h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 mt-1"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Crear evento"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Atoms ─────────────────────────────────────────────────────────────────────
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
