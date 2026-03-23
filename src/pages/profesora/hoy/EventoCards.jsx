import {
  CalendarDays,
  CalendarCheck2,
  Clock,
  MapPin,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { EVENTO_TIPO_LABEL } from "@/constants/estados";
import { TIPO_COLORS, formatFecha, mismaFecha } from "./eventoHelpers";
import { MetaItem } from "./../../../utils/utility";

// ── Card grande — eventos activos hoy ────────────────────────────────────────
export function CardActivo({ evento: e, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border-2 border-teal-100 px-4 py-4 cursor-pointer hover:border-teal-300 transition-colors shadow-sm"
    >
      {/* Cabecera */}
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
          <CalendarDays size={20} className="text-teal-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLORS[e.tipo]}`}
            >
              {EVENTO_TIPO_LABEL[e.tipo]}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-600">
              En curso
            </span>
          </div>
          <p className="text-sm font-black text-stone-800 leading-tight">
            {e.titulo}
          </p>
          {e.descripcion && (
            <p className="text-xs text-stone-400 mt-0.5 line-clamp-2">
              {e.descripcion}
            </p>
          )}
        </div>
        <ChevronRight size={16} className="text-teal-300 shrink-0 mt-1" />
      </div>

      <div className="border-t border-dashed border-stone-100 my-3" />

      {/* Metadatos */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <MetaItem
          icon={<CalendarDays size={12} className="text-stone-300" />}
          label="Inicio"
          value={formatFecha(e.fecha_inicio)}
        />
        <MetaItem
          icon={<CalendarCheck2 size={12} className="text-stone-300" />}
          label="Fin"
          value={
            mismaFecha(e.fecha_inicio, e.fecha_fin)
              ? "Mismo día"
              : formatFecha(e.fecha_fin)
          }
        />
        <MetaItem
          icon={<Clock size={12} className="text-stone-300" />}
          label="Hora"
          value={
            e.hora_inicio
              ? `${e.hora_inicio}${e.hora_fin ? ` — ${e.hora_fin}` : ""}`
              : "Sin hora definida"
          }
          muted={!e.hora_inicio}
        />
        {e.lugar && (
          <MetaItem
            icon={<MapPin size={12} className="text-stone-300" />}
            label="Lugar"
            value={e.lugar}
          />
        )}
      </div>

      {/* Multa */}
      {e.tiene_multa && (
        <div className="flex items-center gap-1.5 bg-red-50 border border-red-100 rounded-xl px-3 py-1.5 mt-3">
          <AlertCircle size={12} className="text-red-400 shrink-0" />
          <span className="text-xs font-bold text-red-500">
            Multa por ausencia: S/ {parseFloat(e.multa_monto).toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Card compacto — próximos y pasados ────────────────────────────────────────
export function CardCompacto({ evento: e, onClick, muted }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border px-4 py-3 cursor-pointer transition-colors
        ${
          muted
            ? "border-stone-100 hover:border-stone-200 opacity-70"
            : "border-stone-100 hover:border-blue-200"
        }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${muted ? "bg-stone-50" : "bg-blue-50"}`}
        >
          <CalendarDays
            size={16}
            className={muted ? "text-stone-300" : "text-blue-400"}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TIPO_COLORS[e.tipo]}`}
            >
              {EVENTO_TIPO_LABEL[e.tipo]}
            </span>
            {e.tiene_multa && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-400">
                Multa S/ {parseFloat(e.multa_monto).toFixed(2)}
              </span>
            )}
          </div>

          <p
            className={`text-sm font-bold truncate ${muted ? "text-stone-400" : "text-stone-700"}`}
          >
            {e.titulo}
          </p>

          <p className="text-xs text-stone-400 flex items-center gap-1 mt-0.5">
            <CalendarDays size={10} />
            {mismaFecha(e.fecha_inicio, e.fecha_fin)
              ? formatFecha(e.fecha_inicio)
              : `${formatFecha(e.fecha_inicio)} → ${formatFecha(e.fecha_fin)}`}
            {e.hora_inicio && (
              <>
                <span className="mx-1 text-stone-200">·</span>
                <Clock size={10} />
                {e.hora_inicio}
                {e.hora_fin ? ` — ${e.hora_fin}` : ""}
              </>
            )}
          </p>
        </div>

        <ChevronRight size={14} className="text-stone-200 shrink-0" />
      </div>
    </div>
  );
}
