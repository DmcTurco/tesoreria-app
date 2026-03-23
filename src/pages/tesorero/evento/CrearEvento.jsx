import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useEventos } from "@/hook/useEventos";
import { EVENTO_TIPO_LABEL } from "@/constants/estados";
import { Field, today, Row, Toast } from "../../../utils/utility";

const TIPOS = [
  {
    value: "0",
    label: "Guardia",
    desc: "Rotación de padres por fecha",
    color: "bg-amber-50 text-amber-700 border-amber-200",
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
    color: "bg-blue-50 text-blue-600 border-blue-200",
  },
  {
    value: "3",
    label: "Cuota",
    desc: "Cuota o aporte general a todos",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    value: "4",
    label: "Actividad",
    desc: "Evento especial, manual o general",
    color: "bg-purple-50 text-purple-600 border-purple-200",
  },
];

export default function CrearEvento({ onBack, onCreated }) {
  const [step, setStep] = useState(1);
  const [toast, setToast] = useState(null);

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

  const { createEvento } = useEventos();

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));
  const tipo = form.tipo;
  const isGuardia = tipo === "0";
  const isCobro = tipo === "3";

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
          <p className="text-xs text-stone-400">Paso {step} de 2</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-all
              ${step >= s ? "bg-amber-500" : "bg-stone-200"}`}
          />
        ))}
      </div>

      {/* Paso 1: Datos básicos */}
      {step === 1 && (
        <Paso1
          form={form}
          set={set}
          isGuardia={isGuardia}
          isCobro={isCobro}
          setForm={setForm}
        />
      )}

      {/* Paso 2: Revisión */}
      {step === 2 && <PasoRevision form={form} tipo={tipo} />}

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
        {step < 2 ? (
          <button
            onClick={() => {
              if (!validarPaso1()) return;
              setStep(2);
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

// ── Paso 1: Datos básicos ─────────────────────────────────────────────────────
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
                ${form.tipo === t.value ? t.color : "bg-white border-stone-200 hover:border-stone-300"}`}
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

      {/* Multa */}
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

// ── Paso 2: Revisión ──────────────────────────────────────────────────────────
function PasoRevision({ form, tipo }) {
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

      <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
        <p className="text-xs font-semibold text-amber-600">
          💡 Los padres se asignarán desde la lista de eventos una vez creado.
        </p>
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
