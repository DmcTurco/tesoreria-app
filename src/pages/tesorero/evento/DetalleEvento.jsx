import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { EVENTO_TIPO_LABEL, EVENTO_ESTADO } from "../../../constants/estados";
import useApi from "@/hook/useApi";
import TabPadresEvento from "./TabPadresEvento";
import { Field, Row, formatFecha } from "../../../utils/utility";
import { useAuth } from "@/hook/useAuth";
import TabAjustesEvento from "./TabAjustesEvento";
import { useAjustesEvento } from "@/hook/useAjustesEvento"; // ← nuevo

export default function DetalleEvento({ evento: inicial, onBack, onSaved, onToast }) {
    const { esTesorero } = useAuth();
    const [tab, setTab] = useState("info");
    const [evento, setEvento] = useState(inicial);
    const [form, setForm] = useState({
        titulo:        evento.titulo       ?? "",
        descripcion:   evento.descripcion  ?? "",
        lugar:         evento.lugar        ?? "",
        tiene_multa:   evento.tiene_multa  ?? false,
        tiene_turnos:  evento.tiene_turnos ?? 0,
        multa_monto:   evento.multa_monto  ?? "10",
        fecha_inicio: evento.fecha_inicio ? evento.fecha_inicio.slice(0, 10) : "",
        fecha_fin:    evento.fecha_fin    ? evento.fecha_fin.slice(0, 10)    : "",
        hora_inicio:  evento.hora_inicio  ? evento.hora_inicio.slice(0, 5)  : "",
        hora_fin:     evento.hora_fin     ? evento.hora_fin.slice(0, 5)     : "",
    });
    const [loading, setLoading] = useState(false);
    const [loadingMultas, setLoadingMultas] = useState(false);
    const api = useApi();
    const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

    // ── Hook de ajustes ───────────────────────────────────────────────────────
    const {
        ajustesPendientes,
        setAjustesPendientes,
        getAjustes,
        limpiarAjustes,
    } = useAjustesEvento(evento.id);

    // Verificar ajustes pendientes al abrir el detalle
    useEffect(() => {
        getAjustes();
    }, [evento.id]);

    // ── Tabs ──────────────────────────────────────────────────────────────────
    const tabs = [
        ["info",   "Información"],
        ["padres", "Padres"],
        ["editar", "Editar"],
    ];
    if (evento.tipo === 3) tabs.splice(1, 1);
    if (ajustesPendientes) tabs.push(["ajustes", "⚠️ Ajustes"]);

    // ── Guardar ───────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!form.titulo) { onToast("El título es obligatorio", "err"); return; }
        if (!form.fecha_inicio) { onToast("La fecha de inicio es obligatoria", "err"); return; }
        if (form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
            onToast("La fecha fin no puede ser antes que la fecha inicio", "err"); return;
        }
        const isCobro = evento.tipo === 3;
        if (!isCobro && form.hora_inicio && form.hora_fin && form.hora_fin <= form.hora_inicio) {
            onToast("La hora de fin debe ser después de la hora de inicio", "err"); return;
        }
        setLoading(true);
        try {
            const res = await api.put(`/eventos/${evento.id}`, {
                titulo:       form.titulo,
                descripcion:  form.descripcion  || null,
                lugar:        form.lugar        || null,
                tiene_multa:  isCobro ? false : form.tiene_multa,
                tiene_turnos: (evento.tipo === 0) ? form.tiene_turnos : 0,
                multa_monto:  Number(form.multa_monto),
                fecha_inicio: form.fecha_inicio,
                fecha_fin:    form.fecha_fin    || null,
                hora_inicio:  isCobro ? null : (form.hora_inicio || null),
                hora_fin:     isCobro ? null : (form.hora_fin    || null),
            });

            const ajustes = res?.ajustes ?? {};
            const hayAjustes = (ajustes.con_devolucion > 0) || (ajustes.con_cobro_extra > 0);

            if (hayAjustes) {
                setAjustesPendientes(ajustes);
                setTab("ajustes");
                onToast("Evento actualizado — hay ajustes pendientes", "warn");
            } else {
                onSaved("Evento actualizado");
            }
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
                        <Row label="Tipo"         value={EVENTO_TIPO_LABEL[evento.tipo]} />
                        <Row label="Estado"       value={evento.estado === EVENTO_ESTADO.ACTIVO ? "Activo" : "Cerrado"} />
                        {/* Botón regenerar multas — solo para eventos cerrados con multa activa */}
                        {esTesorero && evento.estado === EVENTO_ESTADO.CERRADO && evento.tiene_multa && (
                            <button
                                onClick={async () => {
                                    setLoadingMultas(true);
                                    try {
                                        const res = await api.post(`/eventos/${evento.id}/regenerar-multas`);
                                        onToast(`Multas regeneradas: ${res.creadas} nueva(s)`);
                                    } catch {
                                        onToast("Error al regenerar multas", "err");
                                    } finally {
                                        setLoadingMultas(false);
                                    }
                                }}
                                disabled={loadingMultas}
                                className="w-full h-10 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                            >
                                {loadingMultas ? <Loader2 size={14} className="animate-spin" /> : "⚠️ Regenerar multas"}
                            </button>
                        )}
                        <Row label="Descripción"  value={evento.descripcion || "—"} />
                        <Row label="Lugar"        value={evento.lugar || "—"} />
                        <Row label="Fecha inicio" value={formatFecha(evento.fecha_inicio)} />
                        <Row label="Fecha fin"    value={evento.fecha_fin ? formatFecha(evento.fecha_fin) : "Sin límite"} />
                        {evento.hora_inicio && (
                            <Row label="Horario" value={`${evento.hora_inicio} — ${evento.hora_fin}`} />
                        )}
                        {(evento.tipo === 3 || evento.tipo === 4) ? (
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
                        <Field label="Título *"    value={form.titulo}      onChange={set("titulo")}      placeholder="Título del evento" />
                        <Field label="Descripción" value={form.descripcion} onChange={set("descripcion")} placeholder="Descripción..." />
                        <Field label="Lugar"       value={form.lugar}       onChange={set("lugar")}       placeholder="Ej: Aula 3°A" />

                        {/* Fechas */}
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Fecha inicio *" type="date"
                                value={form.fecha_inicio} onChange={set("fecha_inicio")} />
                            <Field label={evento.tipo === 3 ? "Fecha fin (opcional)" : "Fecha fin"} type="date"
                                value={form.fecha_fin} onChange={set("fecha_fin")} />
                        </div>

                        {/* Horario — no para cuota (tipo 3) */}
                        {evento.tipo !== 3 && (
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Hora inicio" type="time"
                                    value={form.hora_inicio} onChange={set("hora_inicio")} />
                                <Field label="Hora fin" type="time"
                                    value={form.hora_fin} onChange={set("hora_fin")} />
                            </div>
                        )}

                        {(evento.tipo === 3 || evento.tipo === 4) ? (
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

                        {/* Toggle 2 turnos — solo guardias */}
                        {evento.tipo === 0 && (
                            <div className="flex items-center gap-3 bg-stone-50 rounded-xl px-3 py-2.5">
                                <input
                                    type="checkbox"
                                    id="tiene_turnos_edit"
                                    checked={form.tiene_turnos === 1}
                                    disabled={evento.tiene_turnos === 1} // no se puede desactivar
                                    onChange={(e) => setForm((p) => ({ ...p, tiene_turnos: e.target.checked ? 1 : 0 }))}
                                    className="w-4 h-4 accent-amber-500 disabled:opacity-50"
                                />
                                <div className="flex-1">
                                    <label htmlFor="tiene_turnos_edit" className="text-xs font-semibold text-stone-600 cursor-pointer block">
                                        Tiene 2 turnos (entrada y salida)
                                    </label>
                                    {form.tiene_turnos === 1 && (
                                        <p className="text-[11px] text-stone-400 mt-0.5">
                                            {evento.tiene_turnos === 1
                                                ? "Ya activado — las filas existentes tienen turno asignado"
                                                : "Al guardar se dividirán las asignaciones existentes en 2 turnos"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <button onClick={handleSave} disabled={loading}
                            className="h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 mt-1">
                            {loading ? <Loader2 size={16} className="animate-spin" /> : "Guardar cambios"}
                        </button>
                    </>
                )}

                {/* ── Ajustes ── */}
                {tab === "ajustes" && ajustesPendientes && (
                    <TabAjustesEvento
                        evento={evento}
                        resumen={ajustesPendientes}
                        onToast={onToast}
                        onResuelto={() => {
                            limpiarAjustes();
                            setTab("info");
                            onToast("Todos los ajustes resueltos");
                        }}
                    />
                )}
            </div>
        </div>
    );
}