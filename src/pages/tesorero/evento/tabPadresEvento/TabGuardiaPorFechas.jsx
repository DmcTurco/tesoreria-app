import { useEffect, useState } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import useApi from "@/hook/useApi";
import { formatFecha, StatCard } from "../../../../utils/utility";
import PadreChipWrapper from "./PadreChips";

// Vista guardia: lista de fechas con padres asignados por día
export default function TabGuardiaPorFechas({ evento, onToast, esTesorero }) {
  const [fechas,  setFechas]  = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  const cargar = () => {
    setLoading(true);
    api
      .get(`/eventos/${evento.id}/fechas`)
      .then((r) => setFechas(Array.isArray(r) ? r : []))
      .catch(() => onToast("Error al cargar fechas", "err"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  if (loading) return (
    <div className="flex justify-center py-10">
      <Loader2 size={22} className="text-amber-400 animate-spin" />
    </div>
  );

  if (fechas.length === 0) return (
    <div className="flex flex-col items-center gap-2 py-10 text-stone-300">
      <CalendarCheck size={32} strokeWidth={1.5} />
      <p className="text-sm font-medium">Sin fechas generadas</p>
    </div>
  );

  const totalCompletos   = fechas.filter((f) => f.completo).length;
  const totalIncompletos = fechas.length - totalCompletos;

  return (
    <>
      {/* Resumen global */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatCard value={fechas.length}      label="Fechas"     color="stone"   />
        <StatCard value={totalCompletos}     label="Completas"  color="emerald" />
        <StatCard value={totalIncompletos}   label="Pendientes" color="amber"   />
      </div>

      <p className="text-[11px] text-stone-400 mb-3 font-medium">
        {evento.padres_por_dia} padre(s) requerido(s) por día
      </p>

      <div className="flex flex-col gap-2">
        {fechas.map((f) => (
          <FechaCard
            key={f.fecha}
            f={f}
            evento={evento}
            esTesorero={esTesorero}
            onRefresh={cargar}
            onToast={onToast}
          />
        ))}
      </div>
    </>
  );
}

// Card de una fecha — solo lectura + gestión de padres
function FechaCard({ f, evento, esTesorero, onRefresh, onToast }) {
  const ocupados  = (f.padres ?? []).filter((ep) => ![3, 4].includes(ep.estado)).length;
  const requerido = evento.padres_por_dia;
  const pct       = Math.min(100, Math.round((ocupados / requerido) * 100));

  const hoyDate   = new Date(); hoyDate.setHours(0, 0, 0, 0);
  const fechaDate = new Date(f.fecha + "T00:00:00");
  const esPasado  = fechaDate < hoyDate;
  const esHoy     = fechaDate.getTime() === hoyDate.getTime();
  const esFuturo  = fechaDate > hoyDate;

  const cardStyle = esPasado
    ? "bg-stone-50 border-stone-200"
    : esHoy
      ? "bg-emerald-50/60 border-emerald-200"
      : "bg-blue-50/40 border-blue-200";

  const barColor = pct === 100
    ? esPasado ? "bg-stone-400" : esHoy ? "bg-emerald-400" : "bg-blue-400"
    : esPasado ? "bg-stone-300" : esHoy ? "bg-amber-400"   : "bg-blue-300";

  const fechaTextColor = esPasado ? "text-stone-400" : esHoy ? "text-emerald-700" : "text-blue-700";

  return (
    <div className={`rounded-2xl border transition-all overflow-hidden ${cardStyle}`}>
      {/* Barra progreso */}
      <div className="h-1 bg-stone-100/80 mx-3 mt-3 rounded-full">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="px-3 pt-2 pb-3">
        <div className="flex items-center justify-between mb-2.5">
          {/* Fecha + badge estado temporal */}
          <div className="flex items-center gap-2">
            <p className={`text-xs font-black ${fechaTextColor}`}>
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

          {/* Solo contador — sin botón asignar */}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
            ${pct === 100
              ? esPasado ? "bg-stone-100 text-stone-500" : esHoy ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
              : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            {ocupados}/{requerido}
            {pct === 100 ? " ✓" : ` · falta ${f.faltante}`}
          </span>
        </div>

        {/* Chips de padres */}
        {(f.padres ?? []).length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {(f.padres ?? []).map((ep) => (
              <PadreChipWrapper
                key={ep.id}
                ep={ep}
                evento={evento}
                esTesorero={esTesorero}
                onRefresh={onRefresh}
                onToast={onToast}
              />
            ))}
          </div>
        ) : (
          <p className="text-[10px] text-stone-300 italic">Sin padres asignados</p>
        )}
      </div>
    </div>
  );
}
