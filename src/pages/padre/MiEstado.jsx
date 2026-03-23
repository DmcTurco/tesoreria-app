import { useEffect, useState } from "react";
import {
  AlertTriangle, CheckCircle, CreditCard,
  CalendarDays, Loader2, AlertCircle, Wallet,
} from "lucide-react";
import useApi from "../../hook/useApi";
import {
  MULTA_ESTADO, MULTA_ESTADO_LABEL,
  EVENTO_PADRE_ESTADO, EVENTO_PADRE_ESTADO_LABEL,
} from "../../constants/estados";

const MULTA_COLORS = {
  0: "bg-yellow-50 text-yellow-700",
  1: "bg-amber-50 text-amber-700",
  2: "bg-emerald-50 text-emerald-700",
  3: "bg-blue-50 text-blue-600",
  4: "bg-stone-100 text-stone-400",
};

const ABONO_TIPO_COLORS = {
  multa: "bg-red-50 text-red-600",
  cobro: "bg-orange-50 text-orange-600",
};

function formatFecha(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return new Date(+y, +m - 1, +d).toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function initiales(nombre) {
  return nombre?.split(" ").slice(0, 2).map((w) => w[0]).join("") ?? "?";
}

export default function MiEstado() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const api = useApi();

  useEffect(() => {
    api.get("/mi-estado")
      .then((r) => setData(r))
      .catch(() => setError("Error al cargar tu información"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 size={28} className="text-rose-400 animate-spin" />
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-4 mt-4">
      <AlertCircle size={16} className="text-red-400 shrink-0" />
      <p className="text-sm text-red-500 font-medium">{error}</p>
    </div>
  );

  const padre  = data?.padre;
  const saldo  = Number(data?.saldo_deuda ?? 0);
  const multas = data?.multas  ?? [];
  const abonos = data?.abonos  ?? [];
  const eventos = data?.eventos ?? [];
  const cobros  = data?.cobros  ?? [];

  const multasPendientes = multas.filter(
    (m) => Number(m.estado) === MULTA_ESTADO.PENDIENTE || Number(m.estado) === 1
  );

  const cobrosPendientes = cobros.length > 0
    ? cobros
    : eventos.filter(
        (ep) => ep.estado === EVENTO_PADRE_ESTADO.PENDIENTE && ep.evento?.tipo === 3
      );

  const totalMultas = multasPendientes.reduce(
    (s, m) => s + Number(m.monto) - Number(m.monto_pagado ?? 0), 0
  );
  const totalCobros = cobrosPendientes.reduce(
    (s, ep) => s + Number(ep.evento?.multa_monto ?? 0) - Number(ep.monto_pagado ?? 0), 0
  );

  return (
    <div className="flex flex-col gap-4">

      {/* Encabezado */}
      <div>
        <h1 className="text-xl font-black text-stone-800">Mi estado</h1>
        <p className="text-sm text-stone-400">Tu resumen de deuda y asistencia</p>
      </div>

      {/* Perfil */}
      <div className="bg-white rounded-2xl border border-stone-100 px-4 py-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-rose-600">{initiales(padre?.nombre)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-stone-800 truncate">{padre?.nombre}</p>
          <p className="text-xs text-stone-400 truncate">{padre?.hijo} · {padre?.grado}</p>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-stone-100 text-stone-400 shrink-0">
          {padre?.codigo}
        </span>
      </div>

      {/* Resumen de deuda */}
      <div className="bg-white rounded-2xl border border-stone-100 px-4 py-4 flex flex-col gap-3">
        <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Resumen de deuda</p>

        <div className="grid grid-cols-3 gap-2">
          <div className="bg-stone-50 rounded-xl p-3 flex flex-col gap-1">
            <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">Multas</p>
            <p className={`text-lg font-black ${totalMultas > 0 ? "text-red-500" : "text-stone-300"}`}>
              S/ {totalMultas.toFixed(2)}
            </p>
            <p className="text-[10px] text-stone-400">
              {multasPendientes.length} pendiente{multasPendientes.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="bg-stone-50 rounded-xl p-3 flex flex-col gap-1">
            <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">Cobros</p>
            <p className={`text-lg font-black ${totalCobros > 0 ? "text-orange-500" : "text-stone-300"}`}>
              S/ {totalCobros.toFixed(2)}
            </p>
            <p className="text-[10px] text-stone-400">
              {cobrosPendientes.length} pendiente{cobrosPendientes.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="bg-stone-50 rounded-xl p-3 flex flex-col gap-1">
            <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">Total</p>
            <p className={`text-lg font-black ${saldo > 0 ? "text-stone-800" : "text-emerald-500"}`}>
              S/ {saldo.toFixed(2)}
            </p>
            <p className="text-[10px] text-stone-400">
              {saldo > 0 ? "deuda activa" : "al día ✓"}
            </p>
          </div>
        </div>

        {saldo > 0 ? (
          <div className="flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2.5">
            <AlertTriangle size={13} className="text-red-400 shrink-0" />
            <p className="text-xs text-red-500 font-medium">
              Acércate a la tesorería para ponerte al día.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2.5">
            <CheckCircle size={13} className="text-emerald-500 shrink-0" />
            <p className="text-xs text-emerald-600 font-medium">
              Estás al día con todos tus pagos.
            </p>
          </div>
        )}
      </div>

      {/* Cobros pendientes */}
      {cobrosPendientes.length > 0 && (
        <SeccionCard
          titulo="Cobros pendientes"
          badge={cobrosPendientes.length}
          badgeColor="bg-orange-50 text-orange-600"
          icon={<CreditCard size={15} className="text-orange-400" />}
        >
          {cobrosPendientes.map((ep) => (
            <FilaItem
              key={ep.id}
              titulo={ep.evento?.titulo ?? "—"}
              subtitulo={ep.evento?.descripcion}
              fecha={ep.evento?.fecha_fin ? `Hasta: ${formatFecha(ep.evento.fecha_fin)}` : "Sin fecha límite"}
              monto={`S/ ${(Number(ep.evento?.multa_monto ?? 0) - Number(ep.monto_pagado ?? 0)).toFixed(2)}`}
              montoColor="text-orange-600"
              badge="Pendiente"
              badgeColor="bg-orange-50 text-orange-600"
            />
          ))}
        </SeccionCard>
      )}

      {/* Multas */}
      <SeccionCard
        titulo="Multas"
        badge={multasPendientes.length}
        badgeColor="bg-red-50 text-red-500"
        icon={<AlertTriangle size={15} className="text-red-400" />}
      >
        {multas.length === 0 ? (
          <p className="text-center text-stone-300 text-sm py-4">Sin multas registradas</p>
        ) : (
          multas.map((m) => (
            <FilaItem
              key={m.id}
              titulo={m.concepto}
              subtitulo={m.motivo_exoneracion ? `Exonerada: ${m.motivo_exoneracion}` : null}
              fecha={formatFecha(m.fecha_generada)}
              monto={`S/ ${Number(m.monto).toFixed(2)}`}
              montoColor="text-stone-700"
              badge={MULTA_ESTADO_LABEL[m.estado]}
              badgeColor={MULTA_COLORS[m.estado]}
            />
          ))
        )}
      </SeccionCard>

      {/* Asistencias */}
      <SeccionCard
        titulo="Mis asistencias"
        icon={<CalendarDays size={15} className="text-teal-400" />}
      >
        {eventos.length === 0 ? (
          <p className="text-center text-stone-300 text-sm py-4">Sin eventos asignados</p>
        ) : (
          eventos.map((ep) => (
            <div key={ep.id} className="flex items-center gap-3 py-2.5 border-b border-stone-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-700 truncate">
                  {ep.evento?.titulo ?? "—"}
                </p>
                <p className="text-xs text-stone-400">
                  {ep.fecha ? formatFecha(ep.fecha) : formatFecha(ep.evento?.fecha_inicio)}
                </p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
                ${ep.estado === 1 ? "bg-emerald-50 text-emerald-700"
                : ep.estado === 2 ? "bg-red-50 text-red-500"
                : ep.estado === 4 ? "bg-stone-100 text-stone-400"
                : "bg-yellow-50 text-yellow-700"}`}
              >
                {EVENTO_PADRE_ESTADO_LABEL[ep.estado]}
              </span>
            </div>
          ))
        )}
      </SeccionCard>

      {/* Abonos */}
      <SeccionCard
        titulo="Mis abonos"
        icon={<Wallet size={15} className="text-amber-400" />}
      >
        {abonos.length === 0 ? (
          <p className="text-center text-stone-300 text-sm py-4">Sin abonos registrados</p>
        ) : (
          abonos.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-2.5 border-b border-stone-50 last:border-0">
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ABONO_TIPO_COLORS[a.tipo_deuda] ?? "bg-stone-100 text-stone-500"}`}>
                  {a.tipo_deuda === "multa" ? "Multa" : "Cobro"}
                </span>
                <p className="text-xs text-stone-400">{formatFecha(a.fecha)}</p>
              </div>
              <p className="text-sm font-bold text-emerald-600 shrink-0">
                S/ {Number(a.monto).toFixed(2)}
              </p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
                ${Number(a.estado) === 0 ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-400"}`}
              >
                {Number(a.estado) === 0 ? "Activo" : "Anulado"}
              </span>
            </div>
          ))
        )}
      </SeccionCard>

    </div>
  );
}

// ── Sección con header ────────────────────────────────────────────────────────
function SeccionCard({ titulo, badge, badgeColor, icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-50">
        {icon}
        <p className="text-sm font-black text-stone-700 flex-1">{titulo}</p>
        {badge > 0 && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
            {badge} pendiente{badge > 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="px-4">{children}</div>
    </div>
  );
}

// ── Fila de item con monto y badge ────────────────────────────────────────────
function FilaItem({ titulo, subtitulo, fecha, monto, montoColor, badge, badgeColor }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-stone-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-700 truncate">{titulo}</p>
        {subtitulo && <p className="text-xs text-stone-400 mt-0.5 truncate">{subtitulo}</p>}
        {fecha && <p className="text-xs text-stone-300 mt-0.5">{fecha}</p>}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <p className={`text-sm font-bold ${montoColor}`}>{monto}</p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}>
          {badge}
        </span>
      </div>
    </div>
  );
}