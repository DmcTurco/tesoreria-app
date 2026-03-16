import { useEffect, useState } from "react";
import {
  Plus,
  CalendarDays,
  ChevronRight,
  Loader2,
  X,
  CheckSquare,
  AlertCircle,
  Users,
} from "lucide-react";
import { useEventos } from "../../hook/useEventos";
import { usePadres } from "../../hook/usePadres";
import { EVENTO_TIPO_LABEL, EVENTO_ESTADO } from "../../constants/estados";
import useApi from "../../hook/useApi";
const TIPO_COLORS = {
  0: "bg-amber-50 text-amber-700",
  1: "bg-orange-50 text-orange-600",
  2: "bg-blue-50 text-blue-600",
  3: "bg-emerald-50 text-emerald-700",
  4: "bg-purple-50 text-purple-600",
};

export default function Eventos() {
  const [modal, setModal] = useState(null); // "nuevo" | evento_obj
  const [asignar, setAsignar] = useState(null); // evento para asignar padres
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
                  {/* Asignar padres — solo faena, reunion y actividad */}
                  {[1, 2, 4].includes(e.tipo) &&
                    e.estado === EVENTO_ESTADO.ACTIVO && (
                      <button
                        onClick={() => setAsignar(e)}
                        className="w-8 h-8 rounded-full bg-stone-50 hover:bg-blue-50 flex items-center justify-center transition-colors"
                        title="Asignar padres"
                      >
                        <Users
                          size={15}
                          className="text-stone-400 hover:text-blue-500"
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

      {/* Modal detalle/edición de evento existente */}
      {modal && modal !== "nuevo" && (
        <ModalDetalleEvento
          evento={modal}
          onClose={() => setModal(null)}
          onSaved={() => {
            getEventos();
            showToast("Evento actualizado");
            setModal(null);
          }}
          onError={(msg) => showToast(msg, "err")}
        />
      )}

      {asignar && (
        <ModalAsignarPadres
          evento={asignar}
          onClose={() => setAsignar(null)}
          onToast={showToast}
        />
      )}
    </div>
  );
}

// ── Modal detalle / edición de evento ────────────────────────────────────────
function ModalDetalleEvento({ evento, onClose, onSaved, onError }) {
  const [tab, setTab] = useState("info"); // "info" | "editar"
  const [form, setForm] = useState({
    titulo: evento.titulo ?? "",
    descripcion: evento.descripcion ?? "",
    lugar: evento.lugar ?? "",
    tiene_multa: evento.tiene_multa ?? false,
    multa_monto: evento.multa_monto ?? "10",
  });
  const [loading, setLoading] = useState(false);
  const api = useApi();
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.titulo) {
      onError("El título es obligatorio");
      return;
    }
    setLoading(true);
    try {
      await api.put(`/eventos/${evento.id}`, {
        ...form,
        multa_monto: Number(form.multa_monto),
      });
      onSaved();
    } catch (e) {
      onError(e.message ?? "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 sticky top-0 bg-white">
          <div className="min-w-0 flex-1 pr-4">
            <p className="font-black text-stone-800 text-sm truncate">
              {evento.titulo}
            </p>
            <p className="text-xs text-stone-400 mt-0.5">
              {EVENTO_TIPO_LABEL[evento.tipo]} ·{" "}
              {formatFecha(evento.fecha_inicio)}
              {evento.fecha_fin ? ` → ${formatFecha(evento.fecha_fin)}` : ""}
            </p>
          </div>
          <button onClick={onClose}>
            <X size={18} className="text-stone-400 hover:text-stone-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-stone-100 rounded-xl p-1 gap-1 mx-5 mt-4">
          {[
            ["info", "Información"],
            ["editar", "Editar"],
          ].map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all
                ${tab === k ? "bg-white text-amber-600 shadow-sm" : "text-stone-500"}`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="p-5 flex flex-col gap-3">
          {/* ── Info ── */}
          {tab === "info" && (
            <>
              <Row label="Tipo" value={EVENTO_TIPO_LABEL[evento.tipo]} />
              <Row
                label="Estado"
                value={
                  evento.estado === EVENTO_ESTADO.ACTIVO ? "Activo" : "Cerrado"
                }
              />
              <Row label="Título" value={evento.titulo} />
              <Row label="Descripción" value={evento.descripcion || "—"} />
              <Row label="Lugar" value={evento.lugar || "—"} />
              <Row
                label="Fecha inicio"
                value={formatFecha(evento.fecha_inicio)}
              />
              <Row
                label="Fecha fin"
                value={
                  evento.fecha_fin
                    ? formatFecha(evento.fecha_fin)
                    : "Sin límite"
                }
              />
              {evento.hora_inicio && (
                <Row
                  label="Horario"
                  value={`${evento.hora_inicio} — ${evento.hora_fin}`}
                />
              )}
              <Row
                label="Multa"
                value={
                  evento.tiene_multa
                    ? `Sí — S/ ${Number(evento.multa_monto).toFixed(2)}`
                    : "No"
                }
              />
              {evento.padres_por_dia && (
                <Row label="Padres por día" value={evento.padres_por_dia} />
              )}
            </>
          )}

          {/* ── Editar ── */}
          {tab === "editar" && (
            <>
              <Field
                label="Título *"
                value={form.titulo}
                onChange={set("titulo")}
                placeholder="Título del evento"
              />
              <Field
                label="Descripción"
                value={form.descripcion}
                onChange={set("descripcion")}
                placeholder="Descripción..."
              />
              <Field
                label="Lugar"
                value={form.lugar}
                onChange={set("lugar")}
                placeholder="Ej: Aula 3°A"
              />

              <div className="flex items-center gap-3 bg-stone-50 rounded-xl px-3 py-2.5">
                <input
                  type="checkbox"
                  id="tiene_multa_edit"
                  checked={form.tiene_multa}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tiene_multa: e.target.checked }))
                  }
                  className="w-4 h-4 accent-amber-500"
                />
                <label
                  htmlFor="tiene_multa_edit"
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

              <button
                onClick={handleSave}
                disabled={loading}
                className="h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 mt-1"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  "Guardar cambios"
                )}
              </button>
            </>
          )}
        </div>
      </div>
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
        tiene_multa: isCobro ? false : form.tiene_multa,
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

          {/* Cobro → monto obligatorio */}
          {isCobro ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-stone-600">
                Monto del cobro (S/) *
              </label>
              <input
                type="number"
                value={form.multa_monto}
                onChange={set("multa_monto")}
                placeholder="Ej: 50.00"
                className="h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400 transition-colors"
              />
              <p className="text-[11px] text-stone-400">
                Este monto se asignará a cada padre al momento del cobro.
              </p>
            </div>
          ) : (
            /* Otros tipos → multa opcional */
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
          )}

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

// ── Modal asignar padres ──────────────────────────────────────────────────────
function ModalAsignarPadres({ evento, onClose, onToast }) {
  const [asignados, setAsignados] = useState([]); // ids ya asignados
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { padres, getPadres } = usePadres();
  const api = useApi();

  useEffect(() => {
    Promise.all([getPadres(), api.get(`/eventos/${evento.id}/padres`)])
      .then(([_, eps]) => {
        const ids = new Set(
          (Array.isArray(eps) ? eps : []).map((ep) => ep.padre_id),
        );
        setAsignados(ids);
        setSeleccionados(new Set(ids)); // pre-seleccionar los ya asignados
      })
      .catch(() => onToast("Error al cargar padres", "err"))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleGuardar = async () => {
    setSaving(true);
    try {
      // Agregar los nuevos (los que no estaban antes)
      const nuevos = [...seleccionados].filter((id) => !asignados.has(id));
      await Promise.all(
        nuevos.map((padreId) =>
          api.post(`/eventos/${evento.id}/agregar-padre`, {
            padre_id: padreId,
          }),
        ),
      );
      onToast(`${nuevos.length} padre(s) asignado(s)`);
      onClose();
    } catch (e) {
      onToast(e.message ?? "Error al asignar", "err");
    } finally {
      setSaving(false);
    }
  };

  const filtrados = padres.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.hijo?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
          <div>
            <p className="font-black text-stone-800 text-sm">Asignar padres</p>
            <p className="text-xs text-stone-400 truncate">{evento.titulo}</p>
          </div>
          <button onClick={onClose}>
            <X size={18} className="text-stone-400 hover:text-stone-600" />
          </button>
        </div>

        {/* Buscador */}
        <div className="px-4 py-3 border-b border-stone-50 shrink-0">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar padre o alumno..."
              className="w-full h-9 pl-8 pr-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400 transition-colors"
            />
          </div>
          <p className="text-xs text-stone-400 mt-1.5">
            {seleccionados.size} seleccionado(s)
          </p>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={22} className="text-amber-400 animate-spin" />
            </div>
          ) : filtrados.length === 0 ? (
            <p className="text-center text-stone-400 text-sm py-8">
              Sin resultados
            </p>
          ) : (
            filtrados.map((p) => {
              const checked = seleccionados.has(p.id);
              const yaEra = asignados.has(p.id);
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                  ${checked ? "bg-amber-50" : "hover:bg-stone-50"}`}
                  onClick={() => !yaEra && toggle(p.id)}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                  ${checked ? "bg-amber-500 border-amber-500" : "border-stone-300"}`}
                  >
                    {checked && (
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-amber-700">
                      {p.nombre
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-stone-700 truncate">
                      {p.nombre}
                    </p>
                    <p className="text-xs text-stone-400">
                      {p.hijo} · {p.grado}
                    </p>
                  </div>
                  {yaEra && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                      Asignado
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="px-5 py-4 border-t border-stone-100 shrink-0">
          <button
            onClick={handleGuardar}
            disabled={saving}
            className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              `Guardar asignación`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-stone-50">
      <span className="text-stone-400 text-xs">{label}</span>
      <span className="text-stone-700 text-xs font-semibold text-right max-w-[60%]">
        {value}
      </span>
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
