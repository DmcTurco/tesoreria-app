import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Users,
  UserCheck,
  UserX,
  Search,
  X,
} from "lucide-react";
import { useEventos } from "@/hook/useEventos";
import { usePadres } from "@/hook/usePadres";
import { EVENTO_TIPO_LABEL } from "@/constants/estados";

const TIPOS = [
  {
    value: "0",
    label: "Guardia",
    desc: "Rotación de padres por fecha",
    color: "bg-amber-50 text-amber-700   border-amber-200",
  },
  {
    value: "1",
    label: "Faena",
    desc: "Trabajo manual, limpieza, etc.",
    color: "bg-orange-50 text-orange-600 border-orange-200",
  },
  {
    value: "2",
    label: "Reunión",
    desc: "Aplica a todos los padres",
    color: "bg-blue-50   text-blue-600   border-blue-200",
  },
  {
    value: "3",
    label: "Cobro",
    desc: "Cuota o pago general a todos",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    value: "4",
    label: "Actividad",
    desc: "Evento especial, manual o general",
    color: "bg-purple-50 text-purple-600 border-purple-200",
  },
];

// Qué modo de asignación aplica según tipo
// "auto"   → todos los padres automático
// "manual" → el tesorero elige
// "ambos"  → puede elegir o todos
const ASIGNACION = {
  0: "manual",
  1: "manual",
  2: "auto",
  3: "auto",
  4: "ambos",
};

export default function CrearEvento({ onBack, onCreated }) {
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState(null);

  // ── Paso 1: datos básicos ──
  const [form, setForm] = useState({
    tipo: "0",
    titulo: "",
    descripcion: "",
    lugar: "",
    fecha_inicio: today(),
    fecha_fin: "",
    hora_inicio: "07:00",
    hora_fin: "18:00",
    tiene_multa: false,
    multa_monto: "10",
    padres_por_dia: "4",
    dias_semana: [1, 2, 3, 4, 5],
  });

  // ── Paso 2: asignación ──
  const [modoAsig, setModoAsig] = useState("manual"); // "manual" | "auto"
  const [seleccionados, setSeleccionados] = useState(new Set());

  const { createEvento } = useEventos();
  const { padres, getPadres, loading: loadingPadres } = usePadres();

  useEffect(() => {
    getPadres();
  }, []);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const tipo = form.tipo;
  const isGuardia = tipo === "0";
  const isCobro = tipo === "3";
  const isReunion = tipo === "2";
  const modoFinal = ASIGNACION[tipo] === "ambos" ? modoAsig : ASIGNACION[tipo];

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const validarPaso1 = () => {
    if (!form.titulo.trim()) {
      showToast("El título es obligatorio", "err");
      return false;
    }
    if (!form.fecha_inicio) {
      showToast("La fecha de inicio es obligatoria", "err");
      return false;
    }
    if (form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
      showToast("La fecha fin no puede ser antes que la fecha inicio", "err");
      return false;
    }
    if (!isCobro) {
      if (!form.hora_inicio || !form.hora_fin) {
        showToast("Las horas de inicio y fin son obligatorias", "err");
        return false;
      }
      if (form.hora_fin <= form.hora_inicio) {
        showToast(
          "La hora de fin debe ser después de la hora de inicio",
          "err",
        );
        return false;
      }
    }
    if (isGuardia) {
      if (form.dias_semana.length === 0) {
        showToast("Selecciona al menos un día de la semana", "err");
        return false;
      }
      if (!form.padres_por_dia || Number(form.padres_por_dia) < 1) {
        showToast("Indica cuántos padres por día (mínimo 1)", "err");
        return false;
      }
      if (!form.fecha_fin) {
        showToast(
          "La guardia necesita una fecha fin para generar la rotación",
          "err",
        );
        return false;
      }
    }
    if (isCobro && (!form.multa_monto || Number(form.multa_monto) <= 0)) {
      showToast("Ingresa el monto del cobro", "err");
      return false;
    }
    if (
      form.tiene_multa &&
      (!form.multa_monto || Number(form.multa_monto) <= 0)
    ) {
      showToast("Ingresa el monto de la multa", "err");
      return false;
    }
    return true;
  };

  const handleCrear = async () => {
    const payload = {
      tipo: Number(tipo),
      titulo: form.titulo,
      descripcion: form.descripcion || null,
      lugar: form.lugar || null,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin || null,
      hora_inicio: isCobro ? null : form.hora_inicio,
      hora_fin: isCobro ? null : form.hora_fin,
      tiene_multa: isCobro ? false : form.tiene_multa,
      multa_monto: Number(form.multa_monto),
      padres_por_dia: isGuardia ? Number(form.padres_por_dia) : null,
      dias_semana: isGuardia ? form.dias_semana : null,
      // Lista manual de padres (si aplica)
      padres_ids: modoFinal === "manual" ? [...seleccionados] : null,
    };

    try {
      await createEvento(payload);
      onCreated("Evento creado correctamente");
    } catch (e) {
      showToast(e.message ?? "Error al crear evento", "err");
    }
  };

  return (
    <div className="flex flex-col gap-5 min-h-full">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors shrink-0"
        >
          <ArrowLeft size={16} className="text-stone-500" />
        </button>
        <div>
          <h1 className="text-xl font-black text-stone-800">Nuevo evento</h1>
          <p className="text-xs text-stone-400">
            Paso {step} de {isCobro || isReunion ? 2 : 3}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5">
        {[1, 2, 3].map((s) => {
          const total = isCobro || isReunion ? 2 : 3;
          if (s > total) return null;
          return (
            <div
              key={s}
              className={`flex-1 h-1.5 rounded-full transition-all
              ${step >= s ? "bg-amber-500" : "bg-stone-200"}`}
            />
          );
        })}
      </div>

      {/* ── Paso 1: Datos básicos ── */}
      {step === 1 && (
        <Paso1
          form={form}
          set={set}
          isGuardia={isGuardia}
          isCobro={isCobro}
          setForm={setForm}
        />
      )}

      {/* ── Paso 2: Asignación ── */}
      {step === 2 && (
        <Paso2
          tipo={tipo}
          modoAsig={modoAsig}
          setModoAsig={setModoAsig}
          modoFinal={modoFinal}
          padres={padres}
          loading={loadingPadres}
          seleccionados={seleccionados}
          setSeleccionados={setSeleccionados}
          isGuardia={isGuardia}
          isCobro={isCobro}
          isReunion={isReunion}
        />
      )}

      {/* ── Paso 3: Revisión ── */}
      {step === 3 && (
        <Paso3
          form={form}
          tipo={tipo}
          modoFinal={modoFinal}
          seleccionados={seleccionados}
          padres={padres}
        />
      )}

      {/* Navegación */}
      <div className="flex gap-3 mt-auto pt-4">
        {step > 1 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="flex-1 h-11 bg-white border border-stone-200 text-stone-600 text-sm font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-stone-50 transition-colors"
          >
            <ArrowLeft size={15} /> Atrás
          </button>
        )}
        {step < (isCobro || isReunion ? 2 : 3) ? (
          <button
            onClick={() => {
              if (step === 1 && !validarPaso1()) return;
              setStep((s) => s + 1);
            }}
            className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            Siguiente <ArrowRight size={15} />
          </button>
        ) : (
          <BtnCrear onCrear={handleCrear} />
        )}
      </div>
    </div>
  );
}

// ── Paso 1 ────────────────────────────────────────────────────────────────────
function Paso1({ form, set, isGuardia, isCobro, setForm }) {
  const DIAS = [
    { v: 1, l: "L" },
    { v: 2, l: "M" },
    { v: 3, l: "X" },
    { v: 4, l: "J" },
    { v: 5, l: "V" },
    { v: 6, l: "S" },
    { v: 7, l: "D" },
  ];

  const toggleDia = (v) => {
    setForm((p) => ({
      ...p,
      dias_semana: p.dias_semana.includes(v)
        ? p.dias_semana.filter((d) => d !== v)
        : [...p.dias_semana, v],
    }));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Tipo */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-stone-600">
          Tipo de evento
        </label>
        <div className="grid grid-cols-1 gap-2">
          {TIPOS.map((t) => (
            <button
              key={t.value}
              onClick={() => setForm((p) => ({ ...p, tipo: t.value }))}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all
                ${form.tipo === t.value ? t.color + " border-2" : "bg-white border-stone-200 hover:border-stone-300"}`}
            >
              <div className="flex-1">
                <p
                  className={`text-sm font-bold ${form.tipo === t.value ? "" : "text-stone-700"}`}
                >
                  {t.label}
                </p>
                <p
                  className={`text-xs ${form.tipo === t.value ? "opacity-70" : "text-stone-400"}`}
                >
                  {t.desc}
                </p>
              </div>
              {form.tipo === t.value && <Check size={16} />}
            </button>
          ))}
        </div>
      </div>

      {/* Título */}
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

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-3">
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

      {/* Horario — no para cobro */}
      {!isCobro && (
        <div className="grid grid-cols-2 gap-3">
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

      {/* Guardia: días + padres por día */}
      {isGuardia && (
        <>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-stone-600">
              Días de la semana
            </label>
            <div className="flex gap-2">
              {DIAS.map((d) => (
                <button
                  key={d.v}
                  onClick={() => toggleDia(d.v)}
                  className={`w-9 h-9 rounded-full text-xs font-bold transition-all
                    ${
                      form.dias_semana.includes(d.v)
                        ? "bg-amber-500 text-white"
                        : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                    }`}
                >
                  {d.l}
                </button>
              ))}
            </div>
          </div>
          <Field
            label="Padres por día"
            type="number"
            value={form.padres_por_dia}
            onChange={set("padres_por_dia")}
            placeholder="Ej: 4"
          />
        </>
      )}

      {/* Cobro: monto obligatorio */}
      {isCobro ? (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-stone-600">
            Monto del cobro (S/) *
          </label>
          <input
            type="number"
            value={form.multa_monto}
            onChange={set("multa_monto")}
            placeholder="Ej: 50.00"
            className="h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400"
          />
          <p className="text-[11px] text-stone-400">
            Se asignará a cada padre automáticamente.
          </p>
        </div>
      ) : (
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
    </div>
  );
}

// ── Paso 2 ────────────────────────────────────────────────────────────────────
function Paso2({
  tipo,
  modoAsig,
  setModoAsig,
  modoFinal,
  padres,
  loading,
  seleccionados,
  setSeleccionados,
  isGuardia,
  isCobro,
  isReunion,
}) {
  const [search, setSearch] = useState("");

  const toggle = (id) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    if (seleccionados.size === padres.length) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(padres.map((p) => p.id)));
    }
  };

  const filtrados = padres.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.hijo?.toLowerCase().includes(search.toLowerCase()),
  );

  // Auto y cobro → solo info
  if (isCobro || isReunion) {
    return (
      <div className="flex flex-col gap-4">
        <div
          className={`rounded-2xl p-5 flex flex-col gap-2 ${isCobro ? "bg-emerald-50 border border-emerald-100" : "bg-blue-50 border border-blue-100"}`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCobro ? "bg-emerald-100" : "bg-blue-100"}`}
            >
              <Users
                size={20}
                className={isCobro ? "text-emerald-600" : "text-blue-600"}
              />
            </div>
            <div>
              <p
                className={`text-sm font-black ${isCobro ? "text-emerald-800" : "text-blue-800"}`}
              >
                {isCobro ? "Aplica a todos los padres" : "Convocatoria general"}
              </p>
              <p
                className={`text-xs ${isCobro ? "text-emerald-600" : "text-blue-500"}`}
              >
                {padres.length} padres registrados
              </p>
            </div>
          </div>
          <p
            className={`text-xs ${isCobro ? "text-emerald-600" : "text-blue-500"}`}
          >
            {isCobro
              ? "Al crear el evento, se asignará automáticamente a todos los padres con el monto indicado."
              : "Al crear el evento, todos los padres quedarán asignados a esta reunión."}
          </p>
        </div>
      </div>
    );
  }

  // Guardia → también selección manual (mismos padres rotan por fecha)
  if (isGuardia) {
    return (
      <div className="flex flex-col gap-4">
        <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
          <p className="text-xs font-bold text-amber-700 mb-1">
            ¿Cómo funciona la guardia?
          </p>
          <p className="text-xs text-amber-600 leading-relaxed">
            Selecciona los padres que participarán en la rotación. El sistema
            los distribuirá automáticamente por fecha según los días y la
            cantidad por día que configuraste.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-stone-600">
            {seleccionados.size} de {padres.length} seleccionados
          </p>
          <button
            onClick={toggleTodos}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
          >
            {seleccionados.size === padres.length
              ? "Deseleccionar todos"
              : "Seleccionar todos"}
          </button>
        </div>

        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar padre o alumno..."
            className="w-full h-9 pl-8 pr-3 bg-white border border-stone-200 rounded-xl text-xs text-stone-700 outline-none focus:border-amber-400"
          />
        </div>

        <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50 max-h-72 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="text-amber-400 animate-spin" />
            </div>
          ) : filtrados.length === 0 ? (
            <p className="text-center text-stone-400 text-sm py-6">
              Sin resultados
            </p>
          ) : (
            filtrados.map((p) => {
              const checked = seleccionados.has(p.id);
              return (
                <div
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                  ${checked ? "bg-amber-50" : "hover:bg-stone-50"}`}
                >
                  <div
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                  ${checked ? "bg-amber-500 border-amber-500" : "border-stone-300"}`}
                  >
                    {checked && (
                      <Check size={11} className="text-white" strokeWidth={3} />
                    )}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-amber-700">
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
                </div>
              );
            })
          )}
        </div>

        {seleccionados.size > 0 && seleccionados.size < 2 && (
          <p className="text-xs text-orange-500 font-medium">
            ⚠ Selecciona al menos 2 padres para una rotación efectiva
          </p>
        )}
      </div>
    );
  }

  // Faena y Actividad → manual o todos
  return (
    <div className="flex flex-col gap-4">
      {/* Toggle manual / todos (solo actividad) */}
      {tipo === "4" && (
        <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
          {[
            ["manual", "Seleccionar padres"],
            ["auto", "Todos los padres"],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setModoAsig(v)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all
                ${modoAsig === v ? "bg-white text-amber-600 shadow-sm" : "text-stone-500"}`}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {modoFinal === "auto" ? (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-center">
          <Users size={28} className="text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-amber-800">
            Todos los padres ({padres.length})
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Se asignarán automáticamente al crear
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-stone-600">
              {seleccionados.size} de {padres.length} seleccionados
            </p>
            <button
              onClick={toggleTodos}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
            >
              {seleccionados.size === padres.length
                ? "Deseleccionar todos"
                : "Seleccionar todos"}
            </button>
          </div>

          {/* Buscador */}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar padre o alumno..."
              className="w-full h-9 pl-8 pr-3 bg-white border border-stone-200 rounded-xl text-xs text-stone-700 outline-none focus:border-amber-400"
            />
          </div>

          {/* Lista */}
          <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50 max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-6">
                <Loader2 size={20} className="text-amber-400 animate-spin" />
              </div>
            ) : filtrados.length === 0 ? (
              <p className="text-center text-stone-400 text-sm py-6">
                Sin resultados
              </p>
            ) : (
              filtrados.map((p) => {
                const checked = seleccionados.has(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                    ${checked ? "bg-amber-50" : "hover:bg-stone-50"}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                    ${checked ? "bg-amber-500 border-amber-500" : "border-stone-300"}`}
                    >
                      {checked && (
                        <Check
                          size={11}
                          className="text-white"
                          strokeWidth={3}
                        />
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-amber-700">
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
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Paso 3: Revisión ──────────────────────────────────────────────────────────
function Paso3({ form, tipo, modoFinal, seleccionados, padres }) {
  const isCobro = tipo === "3";
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-bold text-stone-500 uppercase tracking-wide">
        Resumen
      </p>

      <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50">
        <Row label="Tipo" value={EVENTO_TIPO_LABEL[Number(tipo)]} />
        <Row label="Título" value={form.titulo} />
        {form.descripcion && (
          <Row label="Descripción" value={form.descripcion} />
        )}
        {form.lugar && <Row label="Lugar" value={form.lugar} />}
        <Row label="Fecha inicio" value={form.fecha_inicio} />
        {form.fecha_fin && <Row label="Fecha fin" value={form.fecha_fin} />}
        {!isCobro && form.hora_inicio && (
          <Row
            label="Horario"
            value={`${form.hora_inicio} — ${form.hora_fin}`}
          />
        )}
        {isCobro ? (
          <Row
            label="Monto del cobro"
            value={`S/ ${Number(form.multa_monto).toFixed(2)}`}
          />
        ) : (
          form.tiene_multa && (
            <Row
              label="Multa por ausencia"
              value={`S/ ${Number(form.multa_monto).toFixed(2)}`}
            />
          )
        )}
        {tipo === "0" && (
          <Row label="Padres por día" value={form.padres_por_dia} />
        )}
      </div>

      {/* Asignación */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
        <p className="text-xs font-bold text-amber-700 mb-1">
          Asignación de padres
        </p>
        {tipo === "2" || tipo === "3" ? (
          <p className="text-xs text-amber-600">
            Todos los padres ({padres.length})
          </p>
        ) : tipo === "0" ? (
          <p className="text-xs text-amber-600">
            Rotación con {seleccionados.size} padre
            {seleccionados.size !== 1 ? "s" : ""} seleccionado
            {seleccionados.size !== 1 ? "s" : ""}
          </p>
        ) : modoFinal === "auto" ? (
          <p className="text-xs text-amber-600">
            Todos los padres ({padres.length})
          </p>
        ) : (
          <p className="text-xs text-amber-600">
            {seleccionados.size} padre{seleccionados.size !== 1 ? "s" : ""}{" "}
            seleccionado{seleccionados.size !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Botón crear con loading ───────────────────────────────────────────────────
function BtnCrear({ onCrear }) {
  const [loading, setLoading] = useState(false);
  const handle = async () => {
    setLoading(true);
    await onCrear();
    setLoading(false);
  };
  return (
    <button
      onClick={handle}
      disabled={loading}
      className="flex-1 h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <>
          <Check size={15} /> Crear evento
        </>
      )}
    </button>
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

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5">
      <span className="text-xs text-stone-400">{label}</span>
      <span className="text-xs font-semibold text-stone-700 text-right max-w-[60%]">
        {value}
      </span>
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

function today() {
  return new Date().toISOString().slice(0, 10);
}
