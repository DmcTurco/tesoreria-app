import { useState } from "react";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { EVENTO_TIPO_LABEL, EVENTO_ESTADO } from "../../../constants/estados";
import useApi from "@/hook/useApi";
import TabPadresEvento from "./TabPadresEvento"; // lo extraemos abajo
import { Field,Row,formatFecha } from "../../../utils/utility";
import { useAuth } from "@/hook/useAuth";



export default function DetalleEvento({ evento: inicial, onBack, onSaved, onToast }) {
  const { esTesorero } = useAuth();
  const [tab, setTab] = useState("info");
  const [evento, setEvento] = useState(inicial);
  const [form, setForm] = useState({
    titulo:      evento.titulo      ?? "",
    descripcion: evento.descripcion ?? "",
    lugar:       evento.lugar       ?? "",
    tiene_multa: evento.tiene_multa ?? false,
    multa_monto: evento.multa_monto ?? "10",
  });
  const [loading, setLoading] = useState(false);
  const api = useApi();
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const tabs = [
    ["info",   "Información"],
    ["padres", "Padres"],
    ["editar", "Editar"],
  ];
  // Cobro no tiene tab de padres
  if (evento.tipo === 3) tabs.splice(1, 1);

  const handleSave = async () => {
    if (!form.titulo) { onToast("El título es obligatorio", "err"); return; }
    setLoading(true);
    try {
      await api.put(`/eventos/${evento.id}`, {
        ...form,
        multa_monto: Number(form.multa_monto),
      });
      onSaved("Evento actualizado");
    } catch (e) {
      onToast(e.message ?? "Error al actualizar", "err");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors"
        >
          <ArrowLeft size={16} className="text-stone-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-stone-800 truncate">{evento.titulo}</h1>
          <p className="text-xs text-stone-400">
            {EVENTO_TIPO_LABEL[evento.tipo]} · {formatFecha(evento.fecha_inicio)}
            {evento.fecha_fin ? ` → ${formatFecha(evento.fecha_fin)}` : ""}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
        {tabs.map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all
              ${tab === k ? "bg-white text-amber-600 shadow-sm" : "text-stone-500"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-3">

        {/* ── Información ── */}
        {tab === "info" && (
          <>
            <Row label="Tipo"        value={EVENTO_TIPO_LABEL[evento.tipo]} />
            <Row label="Estado"      value={evento.estado === EVENTO_ESTADO.ACTIVO ? "Activo" : "Cerrado"} />
            <Row label="Descripción" value={evento.descripcion || "—"} />
            <Row label="Lugar"       value={evento.lugar || "—"} />
            <Row label="Fecha inicio" value={formatFecha(evento.fecha_inicio)} />
            <Row label="Fecha fin"   value={evento.fecha_fin ? formatFecha(evento.fecha_fin) : "Sin límite"} />
            {evento.hora_inicio && (
              <Row label="Horario" value={`${evento.hora_inicio} — ${evento.hora_fin}`} />
            )}
            {evento.tipo === 3 ? (
              <Row label="Monto del cobro" value={`S/ ${Number(evento.multa_monto).toFixed(2)}`} />
            ) : (
              <Row label="Multa" value={evento.tiene_multa ? `Sí — S/ ${Number(evento.multa_monto).toFixed(2)}` : "No"} />
            )}
            {evento.padres_por_dia && (
              <Row label="Padres por día" value={evento.padres_por_dia} />
            )}
          </>
        )}

        {/* ── Padres ── */}
        {tab === "padres" && (
            <TabPadresEvento evento={evento} onToast={onToast} esTesorero={esTesorero} />
        )}

        {/* ── Editar ── */}
        {tab === "editar" && (
          <>
            <Field label="Título *"     value={form.titulo}      onChange={set("titulo")}      placeholder="Título del evento" />
            <Field label="Descripción"  value={form.descripcion} onChange={set("descripcion")} placeholder="Descripción..." />
            <Field label="Lugar"        value={form.lugar}       onChange={set("lugar")}       placeholder="Ej: Aula 3°A" />

            {evento.tipo === 3 ? (
              <Field label="Monto del cobro (S/)" type="number"
                value={form.multa_monto} onChange={set("multa_monto")} placeholder="50.00" />
            ) : (
              <div className="flex items-center gap-3 bg-stone-50 rounded-xl px-3 py-2.5">
                <input type="checkbox" id="tiene_multa_edit"
                  checked={form.tiene_multa}
                  onChange={(e) => setForm((p) => ({ ...p, tiene_multa: e.target.checked }))}
                  className="w-4 h-4 accent-amber-500"
                />
                <label htmlFor="tiene_multa_edit"
                  className="text-xs font-semibold text-stone-600 cursor-pointer flex-1">
                  Genera multa por ausencia
                </label>
                {form.tiene_multa && (
                  <input type="number" value={form.multa_monto} onChange={set("multa_monto")}
                    className="w-20 h-8 px-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-700 outline-none focus:border-amber-400 text-right"
                    placeholder="10"
                  />
                )}
              </div>
            )}

            <button onClick={handleSave} disabled={loading}
              className="h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 mt-1">
              {loading ? <Loader2 size={16} className="animate-spin" /> : "Guardar cambios"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

