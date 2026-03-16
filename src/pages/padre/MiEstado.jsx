import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  CreditCard,
  CalendarDays,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import useApi from "../../hook/useApi";
import {
  MULTA_ESTADO,
  MULTA_ESTADO_LABEL,
  PAGO_ESTADO,
  PAGO_ESTADO_LABEL,
  EVENTO_PADRE_ESTADO,
  EVENTO_PADRE_ESTADO_LABEL,
} from "../../constants/estados";

const MULTA_COLORS = {
  0: "bg-yellow-50 text-yellow-700",
  1: "bg-emerald-50 text-emerald-700",
  2: "bg-blue-50 text-blue-600",
  3: "bg-stone-100 text-stone-400",
};

const PAGO_COLORS = {
  0: "bg-yellow-50 text-yellow-700",
  1: "bg-emerald-50 text-emerald-700",
  2: "bg-stone-100 text-stone-400",
};

export default function MiEstado() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openSection, setOpenSection] = useState("multas");
  const api = useApi();

  useEffect(() => {
    api
      .get("/mi-estado")
      .then((r) => setData(r))
      .catch(() => setError("Error al cargar tu información"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="text-rose-400 animate-spin" />
      </div>
    );

  if (error)
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-4 mt-4">
        <AlertCircle size={16} className="text-red-400 shrink-0" />
        <p className="text-sm text-red-500 font-medium">{error}</p>
      </div>
    );

  const padre = data?.padre;
  const saldo = Number(data?.saldo_deuda ?? 0);
  const multas = data?.multas ?? [];
  const pagos = data?.pagos ?? [];
  const eventos = data?.eventos ?? [];
  const cobros = data?.cobros ?? []; // cobros pendientes con monto

  const multasPendientes = multas.filter(
    (m) => m.estado === MULTA_ESTADO.PENDIENTE,
  );
  const pagosPendientes = pagos.filter(
    (p) => p.estado === PAGO_ESTADO.PENDIENTE,
  );

  // También detectar cobros desde eventos si el backend aún no los manda separados
  const cobrosPendientes =
    cobros.length > 0
      ? cobros
      : eventos.filter(
          (ep) =>
            ep.estado === EVENTO_PADRE_ESTADO.PENDIENTE &&
            ep.evento?.tipo === 3,
        );

  return (
    <div className="flex flex-col gap-5">
      {/* Cabecera perfil */}
      <div>
        <h1 className="text-xl font-black text-stone-800">Mi estado</h1>
        <p className="text-sm text-stone-400">{padre?.nombre}</p>
      </div>

      {/* Card saldo total */}
      <div
        className={`rounded-2xl overflow-hidden border
        ${saldo > 0 ? "border-red-100" : "border-emerald-100"}`}
      >
        {/* Saldo principal */}
        <div
          className={`p-5 flex items-center gap-4
          ${saldo > 0 ? "bg-red-50" : "bg-emerald-50"}`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0
            ${saldo > 0 ? "bg-red-100" : "bg-emerald-100"}`}
          >
            {saldo > 0 ? (
              <AlertTriangle size={22} className="text-red-500" />
            ) : (
              <CheckCircle size={22} className="text-emerald-500" />
            )}
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500">
              Deuda total pendiente
            </p>
            <p
              className={`text-2xl font-black ${saldo > 0 ? "text-red-600" : "text-emerald-600"}`}
            >
              S/ {saldo.toFixed(2)}
            </p>
            <p
              className={`text-xs font-semibold ${saldo > 0 ? "text-red-400" : "text-emerald-500"}`}
            >
              {saldo > 0
                ? "Acércate a la tesorería para ponerte al día"
                : "Estás al día ✓"}
            </p>
          </div>
        </div>

        {/* Desglose: multas + cuotas + cobros */}
        {saldo > 0 && (
          <div className="grid grid-cols-3 divide-x divide-stone-100 bg-white">
            <div className="px-3 py-3">
              <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">
                Multas
              </p>
              <p className="text-base font-black text-red-500 mt-0.5">
                S/{" "}
                {multasPendientes
                  .reduce((s, m) => s + Number(m.monto), 0)
                  .toFixed(2)}
              </p>
              <p className="text-[10px] text-stone-400">
                {multasPendientes.length} pendiente
                {multasPendientes.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="px-3 py-3">
              <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">
                Cuotas
              </p>
              <p className="text-base font-black text-yellow-600 mt-0.5">
                S/{" "}
                {pagosPendientes
                  .reduce((s, p) => s + Number(p.monto), 0)
                  .toFixed(2)}
              </p>
              <p className="text-[10px] text-stone-400">
                {pagosPendientes.length} pendiente
                {pagosPendientes.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="px-3 py-3">
              <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide">
                Cobros
              </p>
              <p className="text-base font-black text-orange-500 mt-0.5">
                S/{" "}
                {cobrosPendientes
                  .reduce((s, ep) => s + Number(ep.evento?.multa_monto ?? 0), 0)
                  .toFixed(2)}
              </p>
              <p className="text-[10px] text-stone-400">
                {cobrosPendientes.length} pendiente
                {cobrosPendientes.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Info del alumno */}
      <div className="bg-white rounded-2xl border border-stone-100 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
          <span className="text-sm font-black text-rose-600">
            {padre?.nombre
              ?.split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("") ?? "?"}
          </span>
        </div>
        <div>
          <p className="text-sm font-bold text-stone-700">{padre?.hijo}</p>
          <p className="text-xs text-stone-400">
            {padre?.grado} · Código: {padre?.codigo}
          </p>
        </div>
      </div>

      {/* Sección Cobros pendientes — solo si hay */}
      {cobrosPendientes.length > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={15} className="text-orange-500" />
            <p className="text-sm font-black text-orange-700">
              Tienes {cobrosPendientes.length} cobro
              {cobrosPendientes.length !== 1 ? "s" : ""} pendiente
              {cobrosPendientes.length !== 1 ? "s" : ""}
            </p>
          </div>
          {cobrosPendientes.map((ep) => (
            <div
              key={ep.id}
              className="flex items-start gap-3 py-2 border-b border-orange-100 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-orange-800">
                  {ep.evento?.titulo ?? "—"}
                </p>
                <p className="text-xs text-orange-600 mt-0.5">
                  {ep.evento?.descripcion}
                </p>
                {ep.evento?.fecha_fin && (
                  <p className="text-xs text-orange-400 mt-0.5">
                    Hasta: {formatFecha(ep.evento.fecha_fin)}
                  </p>
                )}
                {!ep.evento?.fecha_fin && (
                  <p className="text-xs text-orange-400 mt-0.5">
                    Sin fecha límite
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                {ep.evento?.multa_monto && (
                  <p className="text-sm font-black text-orange-700">
                    S/ {Number(ep.evento.multa_monto).toFixed(2)}
                  </p>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  Pendiente
                </span>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-orange-500 mt-3">
            Acércate al tesorero para registrar tu pago.
          </p>
        </div>
      )}

      {/* Sección Multas */}
      <Seccion
        titulo="Multas"
        badge={multasPendientes.length}
        badgeColor="bg-red-100 text-red-600"
        icon={<AlertTriangle size={16} className="text-red-400" />}
        open={openSection === "multas"}
        onToggle={() =>
          setOpenSection((s) => (s === "multas" ? null : "multas"))
        }
      >
        {multas.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-4">
            Sin multas registradas
          </p>
        ) : (
          multas.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 py-2.5 border-b border-stone-50 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-700 truncate">
                  {m.concepto}
                </p>
                <p className="text-xs text-stone-400">
                  {formatFecha(m.fecha_generada)}
                </p>
                {m.motivo_exoneracion && (
                  <p className="text-xs text-blue-500 mt-0.5">
                    Exonerada: {m.motivo_exoneracion}
                  </p>
                )}
              </div>
              <span className="text-sm font-bold text-stone-700 shrink-0">
                S/ {Number(m.monto).toFixed(2)}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${MULTA_COLORS[m.estado]}`}
              >
                {MULTA_ESTADO_LABEL[m.estado]}
              </span>
            </div>
          ))
        )}
      </Seccion>

      {/* Sección Pagos */}
      <Seccion
        titulo="Pagos"
        badge={pagosPendientes.length}
        badgeColor="bg-yellow-100 text-yellow-700"
        icon={<CreditCard size={16} className="text-amber-400" />}
        open={openSection === "pagos"}
        onToggle={() => setOpenSection((s) => (s === "pagos" ? null : "pagos"))}
      >
        {pagos.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-4">
            Sin pagos registrados
          </p>
        ) : (
          pagos.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 py-2.5 border-b border-stone-50 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-700 truncate">
                  {p.concepto}
                </p>
                <p className="text-xs text-stone-400">{formatFecha(p.fecha)}</p>
              </div>
              <span className="text-sm font-bold text-stone-700 shrink-0">
                S/ {Number(p.monto).toFixed(2)}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${PAGO_COLORS[p.estado]}`}
              >
                {PAGO_ESTADO_LABEL[p.estado]}
              </span>
            </div>
          ))
        )}
      </Seccion>

      {/* Sección Asistencias */}
      <Seccion
        titulo="Mis asistencias"
        icon={<CalendarDays size={16} className="text-teal-400" />}
        open={openSection === "asistencias"}
        onToggle={() =>
          setOpenSection((s) => (s === "asistencias" ? null : "asistencias"))
        }
      >
        {eventos.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-4">
            Sin eventos asignados
          </p>
        ) : (
          eventos.map((ep) => (
            <div
              key={ep.id}
              className="flex items-center gap-3 py-2.5 border-b border-stone-50 last:border-0"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-700 truncate">
                  {ep.evento?.titulo ?? "—"}
                </p>
                <p className="text-xs text-stone-400">
                  {ep.fecha
                    ? formatFecha(ep.fecha)
                    : formatFecha(ep.evento?.fecha_inicio)}
                </p>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
              ${
                ep.estado === 1
                  ? "bg-emerald-50 text-emerald-700"
                  : ep.estado === 2
                    ? "bg-red-50 text-red-500"
                    : ep.estado === 4
                      ? "bg-stone-100 text-stone-400"
                      : "bg-yellow-50 text-yellow-700"
              }`}
              >
                {EVENTO_PADRE_ESTADO_LABEL[ep.estado]}
              </span>
            </div>
          ))
        )}
      </Seccion>
    </div>
  );
}

// ── Atoms ─────────────────────────────────────────────────────────────────────
function Seccion({
  titulo,
  badge,
  badgeColor,
  icon,
  open,
  onToggle,
  children,
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 transition-colors"
      >
        {icon}
        <span className="text-sm font-black text-stone-700 flex-1 text-left">
          {titulo}
        </span>
        {badge > 0 && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}
          >
            {badge} pendiente{badge > 1 ? "s" : ""}
          </span>
        )}
        {open ? (
          <ChevronUp size={15} className="text-stone-400 shrink-0" />
        ) : (
          <ChevronDown size={15} className="text-stone-400 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-2 border-t border-stone-50">{children}</div>
      )}
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
