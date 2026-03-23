import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Check,
  Search,
  Users,
  CalendarCheck,
  UserPlus,
} from "lucide-react";
import { usePadres } from "@/hook/usePadres";
import { EVENTO_TIPO_LABEL } from "../../../constants/estados";
import { formatFecha, StatCard } from "../../../utils/utility";
import useApi from "@/hook/useApi";
import VistaAsignarDia from "./VistaAsignarDia";

// ── Entrada principal ─────────────────────────────────────────────────────────
export default function AsignarPadres({ evento, onBack, onDone, onToast }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors shrink-0"
        >
          <ArrowLeft size={16} className="text-stone-600" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-black text-stone-800 truncate">
            Asignar padres
          </h1>
          <p className="text-xs text-stone-400">
            {EVENTO_TIPO_LABEL[evento.tipo]} · {evento.titulo}
          </p>
        </div>
      </div>

      {/* Delegamos según tipo */}
      {evento.tipo === 0 && (
        <AsignarGuardia evento={evento} onDone={onDone} onToast={onToast} />
      )}
      {evento.tipo === 1 && (
        <AsignarManual evento={evento} onDone={onDone} onToast={onToast} />
      )}
      {evento.tipo === 4 && (
        <AsignarActividad evento={evento} onDone={onDone} onToast={onToast} />
      )}
    </div>
  );
}

// ── Guardia: lista de fechas con slots ────────────────────────────────────────
function AsignarGuardia({ evento, onDone, onToast }) {
  const [fechas, setFechas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaSel, setFechaSel] = useState(null);
  const api = useApi();

  const cargar = () => {
    setLoading(true);
    api
      .get(`/eventos/${evento.id}/fechas`)
      .then((r) => setFechas(Array.isArray(r) ? r : []))
      .catch(() => onToast("Error al cargar fechas", "err"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={22} className="text-amber-400 animate-spin" />
      </div>
    );

  if (fechas.length === 0)
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-stone-300">
        <CalendarCheck size={32} strokeWidth={1.5} />
        <p className="text-sm font-medium">Sin fechas generadas</p>
      </div>
    );

  // Vista de asignación para una fecha específica
  if (fechaSel) {
    const f = fechas.find((f) => f.fecha === fechaSel);
    return (
      <VistaAsignarDia
        evento={evento}
        fecha={fechaSel}
        yaAsignados={(f?.padres ?? []).map((ep) => ep.padre_id)}
        faltante={f?.faltante ?? evento.padres_por_dia}
        onBack={() => setFechaSel(null)}
        onDone={() => {
          setFechaSel(null);
          cargar();
          onToast("Padres asignados correctamente");
        }}
        onError={onToast}
      />
    );
  }

  const totalCompletos = fechas.filter((f) => f.completo).length;
  const totalIncompletos = fechas.length - totalCompletos;

  return (
    <div className="flex flex-col gap-3">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard value={fechas.length} label="Fechas" color="stone" />
        <StatCard value={totalCompletos} label="Completas" color="emerald" />
        <StatCard value={totalIncompletos} label="Pendientes" color="amber" />
      </div>

      <p className="text-[11px] text-stone-400 font-medium">
        {evento.padres_por_dia} padre(s) requerido(s) por día
      </p>

      {/* Fechas */}
      <div className="flex flex-col gap-2">
        {fechas.map((f) => {
          const ocupados = (f.padres ?? []).filter(
            (ep) => ![3, 4].includes(ep.estado),
          ).length;
          const requerido = evento.padres_por_dia;
          const pct = Math.min(100, Math.round((ocupados / requerido) * 100));

          const hoyDate = new Date();
          hoyDate.setHours(0, 0, 0, 0);
          const fechaDate = new Date(f.fecha + "T00:00:00");
          const esHoy = fechaDate.getTime() === hoyDate.getTime();
          const esPasado = fechaDate < hoyDate;
          const esFuturo = fechaDate > hoyDate;

          const cardStyle = esPasado
            ? "bg-stone-50 border-stone-200"
            : esHoy
              ? "bg-emerald-50/60 border-emerald-200"
              : "bg-blue-50/40 border-blue-200";

          const barColor =
            pct === 100
              ? esPasado
                ? "bg-stone-400"
                : esHoy
                  ? "bg-emerald-400"
                  : "bg-blue-400"
              : esPasado
                ? "bg-stone-300"
                : esHoy
                  ? "bg-amber-400"
                  : "bg-blue-300";

          return (
            <div
              key={f.fecha}
              className={`rounded-2xl border overflow-hidden ${cardStyle}`}
            >
              {/* Barra progreso */}
              <div className="h-1 bg-stone-100/80 mx-3 mt-3 rounded-full">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="px-3 pt-2 pb-3">
                <div className="flex items-center justify-between">
                  {/* Fecha + badge */}
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-xs font-black ${esPasado ? "text-stone-400" : esHoy ? "text-emerald-700" : "text-blue-700"}`}
                    >
                      {formatFecha(f.fecha)}
                    </p>
                    {esHoy && (
                      <span className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                        Hoy
                      </span>
                    )}
                    {esPasado && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-400">
                        Pasado
                      </span>
                    )}
                    {esFuturo && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-500 border border-blue-100">
                        Próximo
                      </span>
                    )}
                  </div>

                  {/* Contador + botón */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                      ${
                        pct === 100
                          ? esPasado
                            ? "bg-stone-100 text-stone-500"
                            : esHoy
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-blue-100 text-blue-700"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {ocupados}/{requerido}
                      {pct === 100 ? " ✓" : ` · falta ${f.faltante}`}
                    </span>

                    {pct < 100 && (
                      <button
                        onClick={() => setFechaSel(f.fecha)}
                        className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors
                          ${
                            esPasado
                              ? "bg-stone-200 hover:bg-stone-300 text-stone-600"
                              : esHoy
                                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                : "bg-amber-500 hover:bg-amber-600 text-white"
                          }`}
                      >
                        <UserPlus size={10} />
                        {esPasado ? "Editar" : "Asignar"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Chips de padres asignados */}
                {(f.padres ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {f.padres.map((ep) => (
                      <span
                        key={ep.id}
                        className="text-[10px] font-semibold px-2.5 py-1 bg-white border border-stone-200 rounded-xl text-stone-600"
                      >
                        {ep.padre?.nombre?.split(" ").slice(0, 2).join(" ")}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-stone-300 italic mt-2">
                    Sin padres asignados
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Faena: selección manual ───────────────────────────────────────────────────
function AsignarManual({ evento, onDone, onToast }) {
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [yaAsignados, setYaAsignados] = useState([]);
  const { padres, getPadres, loading } = usePadres();
  const api = useApi();

  useEffect(() => {
    getPadres();
    // Cargar padres ya asignados para no mostrarlos
    api
      .get(`/eventos/${evento.id}/padres`)
      .then((r) =>
        setYaAsignados((Array.isArray(r) ? r : []).map((ep) => ep.padre_id)),
      )
      .catch(() => {});
  }, []);

  const toggle = (id) => {
    setSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    const disponibles = padres.filter((p) => !yaAsignados.includes(p.id));
    if (sel.size === disponibles.length) {
      setSel(new Set());
    } else {
      setSel(new Set(disponibles.map((p) => p.id)));
    }
  };

  const handleSave = async () => {
    if (sel.size === 0) {
      onToast("Selecciona al menos un padre", "err");
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        [...sel].map((padreId) =>
          api.post(`/eventos/${evento.id}/agregar-padre`, {
            padre_id: padreId,
          }),
        ),
      );
      onDone(`${sel.size} padre(s) asignados correctamente`);
    } catch (e) {
      onToast(e.message ?? "Error al asignar", "err");
    } finally {
      setSaving(false);
    }
  };

  const disponibles = padres.filter(
    (p) =>
      !yaAsignados.includes(p.id) &&
      (p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.hijo?.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Contador + seleccionar todos */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-stone-500">
          {sel.size} de{" "}
          {padres.filter((p) => !yaAsignados.includes(p.id)).length}{" "}
          seleccionados
        </p>
        <button
          onClick={toggleTodos}
          className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
        >
          {sel.size === padres.filter((p) => !yaAsignados.includes(p.id)).length
            ? "Deseleccionar todos"
            : "Seleccionar todos"}
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search
          size={13}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar padre o alumno..."
          className="w-full h-10 pl-9 pr-4 bg-white border border-stone-200 rounded-xl text-sm
            text-stone-700 outline-none focus:border-amber-400 transition-colors"
        />
      </div>

      {/* Lista */}
      <ListaPadres
        padres={disponibles}
        loading={loading}
        sel={sel}
        onToggle={toggle}
      />

      {/* Botón confirmar */}
      <button
        onClick={handleSave}
        disabled={saving || sel.size === 0}
        className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold
          rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          `Asignar ${sel.size > 0 ? sel.size + " padre(s)" : ""}`
        )}
      </button>
    </div>
  );
}

// ── Actividad: toggle manual / todos ─────────────────────────────────────────
function AsignarActividad({ evento, onDone, onToast }) {
  const [modo, setModo] = useState("manual"); // "manual" | "auto"
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [yaAsignados, setYaAsignados] = useState([]);
  const { padres, getPadres, loading } = usePadres();
  const api = useApi();

  useEffect(() => {
    getPadres();
    api
      .get(`/eventos/${evento.id}/padres`)
      .then((r) =>
        setYaAsignados((Array.isArray(r) ? r : []).map((ep) => ep.padre_id)),
      )
      .catch(() => {});
  }, []);

  const toggle = (id) => {
    setSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleTodos = () => {
    const disponibles = padres.filter((p) => !yaAsignados.includes(p.id));
    if (sel.size === disponibles.length) {
      setSel(new Set());
    } else {
      setSel(new Set(disponibles.map((p) => p.id)));
    }
  };

  const handleSave = async () => {
    const ids =
      modo === "auto"
        ? padres.filter((p) => !yaAsignados.includes(p.id)).map((p) => p.id)
        : [...sel];

    if (ids.length === 0) {
      onToast("No hay padres para asignar", "err");
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        ids.map((padreId) =>
          api.post(`/eventos/${evento.id}/agregar-padre`, {
            padre_id: padreId,
          }),
        ),
      );
      onDone(`${ids.length} padre(s) asignados correctamente`);
    } catch (e) {
      onToast(e.message ?? "Error al asignar", "err");
    } finally {
      setSaving(false);
    }
  };

  const disponibles = padres.filter(
    (p) =>
      !yaAsignados.includes(p.id) &&
      (p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.hijo?.toLowerCase().includes(search.toLowerCase())),
  );

  const totalDisponibles = padres.filter(
    (p) => !yaAsignados.includes(p.id),
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle */}
      <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
        {[
          ["manual", "Seleccionar padres"],
          ["auto", "Todos los padres"],
        ].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setModo(v)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all
              ${modo === v ? "bg-white text-amber-600 shadow-sm" : "text-stone-500"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Modo auto */}
      {modo === "auto" && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
            <Users size={22} className="text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-black text-amber-800">
              Todos los padres disponibles
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              {totalDisponibles} padre(s) serán asignados
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || totalDisponibles === 0}
            className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold
              rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Confirmar asignación"
            )}
          </button>
        </div>
      )}

      {/* Modo manual */}
      {modo === "manual" && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-stone-500">
              {sel.size} de {totalDisponibles} seleccionados
            </p>
            <button
              onClick={toggleTodos}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors"
            >
              {sel.size === totalDisponibles
                ? "Deseleccionar todos"
                : "Seleccionar todos"}
            </button>
          </div>

          <div className="relative">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar padre o alumno..."
              className="w-full h-10 pl-9 pr-4 bg-white border border-stone-200 rounded-xl text-sm
                text-stone-700 outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          <ListaPadres
            padres={disponibles}
            loading={loading}
            sel={sel}
            onToggle={toggle}
          />

          <button
            onClick={handleSave}
            disabled={saving || sel.size === 0}
            className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold
              rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              `Asignar ${sel.size > 0 ? sel.size + " padre(s)" : ""}`
            )}
          </button>
        </>
      )}
    </div>
  );
}

// ── Lista compartida de padres con checkboxes ─────────────────────────────────
function ListaPadres({ padres, loading, sel, onToggle }) {
  if (loading)
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={20} className="text-amber-400 animate-spin" />
      </div>
    );

  if (padres.length === 0)
    return (
      <div className="bg-white rounded-2xl border border-stone-100 flex flex-col items-center py-10 gap-2">
        <Users size={28} className="text-stone-200" />
        <p className="text-sm text-stone-300 font-medium">
          Sin padres disponibles
        </p>
      </div>
    );

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden max-h-72 overflow-y-auto">
      <div className="divide-y divide-stone-50">
        {padres.map((p) => {
          const checked = sel.has(p.id);
          return (
            <div
              key={p.id}
              onClick={() => onToggle(p.id)}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
