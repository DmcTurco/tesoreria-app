import { Fragment, useCallback, useEffect, useState } from "react";
import {
  Loader2, AlertCircle, FileDown, Download, RefreshCw, ChevronRight,
  TrendingUp, TrendingDown, Wallet, Settings2,
} from "lucide-react";
import useApi from "../../hook/useApi";
import { today } from "../../utils/utility";
import { descargarBalancePDF } from "./balancePdf";

// ── Helpers ───────────────────────────────────────────────────────────────────
const S = (n) => `S/ ${Number(n ?? 0).toFixed(2)}`;
const N = (n) => Number(n ?? 0).toFixed(2);

// v2: antes el nombre por defecto era "APAFA"; ahora es TESORERÍA, así que se
// cambia la clave para que quien ya tenía el valor viejo guardado lo vea actualizado.
const FIRMAS_KEY = "balance_firmas_v2";

/** Primer día del mes, `meses` meses atrás (por defecto 5 → semestre con el actual) */
function inicioSemestre(meses = 5) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - meses);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

/** Último día del mes actual */
function finMesActual() {
  const d = new Date();
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${ultimo.getFullYear()}-${String(ultimo.getMonth() + 1).padStart(2, "0")}-${String(ultimo.getDate()).padStart(2, "0")}`;
}

// ── CSV ───────────────────────────────────────────────────────────────────────
function csvEscape(val) {
  if (val == null) return "";
  const s = String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}
function descargarCSV(filas, nombre) {
  const contenido = filas.map((r) => r.map(csvEscape).join(",")).join("\r\n");
  const blob = new Blob(["﻿" + contenido], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function Balance() {
  const api = useApi();

  const [desde, setDesde] = useState(inicioSemestre());
  const [hasta, setHasta] = useState(finMesActual());
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);
  const [verFirmas, setVerFirmas] = useState(false);

  const [firmas, setFirmas] = useState(() => {
    try {
      const guardado = localStorage.getItem(FIRMAS_KEY);
      if (guardado) return JSON.parse(guardado);
    } catch { /* ignora JSON inválido */ }
    return {
      institucion: "TESORERÍA",
      subtitulo:   "",
      tesorero:    "",
      presidente:  "",
      fiscal:      "",
    };
  });

  const guardarFirmas = (nuevas) => {
    setFirmas(nuevas);
    try { localStorage.setItem(FIRMAS_KEY, JSON.stringify(nuevas)); } catch { /* storage lleno o bloqueado */ }
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/reportes/balance", { params: { desde, hasta } });
      setData(res);
    } catch (e) {
      setError(e.message ?? "No se pudo cargar el balance");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  useEffect(() => { cargar(); }, []); // carga inicial con el semestre por defecto


  // ── PDF firmable ────────────────────────────────────────────────────────────
  const descargarPDF = () => {
    if (!data) return;
    descargarBalancePDF(data, firmas, today());
  };

  // ── CSV del detalle ─────────────────────────────────────────────────────────
  const exportarCSV = () => {
    if (!data) return;
    const r = data.resumen;
    const filas = [
      ["Fecha", "Descripción", "Origen", "Comprobante", "Entró", "Salió", "Registrado por"],
      ...data.movimientos.map((m) => [
        m.fecha, m.descripcion, m.categoria_label, m.comprobante,
        m.tipo === 0 ? N(m.monto) : "",
        m.tipo === 1 ? N(m.monto) : "",
        m.registrado_por,
      ]),
      [],
      ["Teníamos al empezar", N(r.saldo_inicial)],
      ["Entró", N(r.ingresos)],
      ["Se gastó", N(r.egresos)],
      ["Queda en caja", N(r.saldo_final)],
    ];
    descargarCSV(filas, `balance_${data.periodo.desde}_${data.periodo.hasta}.csv`);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-black text-stone-800">Balance del periodo</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Cierre de caja para presentar en asamblea, con anexo de movimientos y firmas
        </p>
      </div>

      {/* Periodo */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-stone-600">Desde</label>
            <input
              type="date" value={desde} onChange={(e) => setDesde(e.target.value)}
              className="h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-stone-600">Hasta</label>
            <input
              type="date" value={hasta} onChange={(e) => setHasta(e.target.value)}
              className="h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400 transition-colors"
            />
          </div>
          <button
            onClick={cargar}
            disabled={loading}
            className="h-10 flex items-center gap-1.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50
              text-white text-xs font-bold rounded-xl transition-colors"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Calcular
          </button>
          <button
            onClick={() => setVerFirmas((v) => !v)}
            className="h-10 flex items-center gap-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold rounded-xl transition-colors"
          >
            <Settings2 size={13} /> Datos del documento
          </button>
        </div>

        {/* Atajos de periodo */}
        <div className="flex flex-wrap gap-2">
          {[
            ["Últimos 6 meses", inicioSemestre(5), finMesActual()],
            ["1er semestre 2026", "2026-01-01", "2026-06-30"],
            ["Marzo – agosto 2026", "2026-03-01", "2026-08-31"],
            ["Año 2026", "2026-01-01", "2026-12-31"],
          ].map(([label, d, h]) => (
            <button
              key={label}
              onClick={() => { setDesde(d); setHasta(h); }}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors
                ${desde === d && hasta === h
                  ? "bg-amber-100 text-amber-700"
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Datos que van en el PDF */}
        {verFirmas && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-stone-100">
            {[
              ["institucion", "Institución"],
              ["subtitulo",   "Subtítulo"],
              ["tesorero",    "Tesorero(a)"],
              ["presidente",  "Presidente(a)"],
              ["fiscal",      "Fiscal"],
            ].map(([campo, label]) => (
              <div key={campo} className="flex flex-col gap-1">
                <label className="text-xs font-bold text-stone-600">{label}</label>
                <input
                  value={firmas[campo] ?? ""}
                  onChange={(e) => guardarFirmas({ ...firmas, [campo]: e.target.value })}
                  placeholder={label}
                  className="h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            ))}
            <p className="col-span-full text-[11px] text-stone-400">
              Estos datos solo se usan en el encabezado y el bloque de firmas del PDF. Quedan guardados en este dispositivo.
            </p>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="text-amber-400 animate-spin" />
        </div>
      )}

      {error && !loading && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      )}

      {data && !loading && (
        <BalanceContenido data={data} onPdf={descargarPDF} onCsv={exportarCSV} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Todo lo que se ve una vez que hay datos. Separado del contenedor para que la
// pantalla no sea un archivo de 700 líneas y para poder renderizarlo con datos
// de prueba sin levantar el backend.
// ─────────────────────────────────────────────────────────────────────────────
export function BalanceContenido({ data, onPdf, onCsv }) {
  const [expandido, setExpandido] = useState(null); // actividad con el detalle de gastos abierto
  const r = data.resumen;

  // ── Cifras derivadas para los textos y gráficos ─────────────────────────────
  const porcentajeGastado = r.ingresos > 0 ? Math.round((r.egresos / r.ingresos) * 100) : 0;

  // El mes que no muestra ingresos en caja pero sí tuvo actividades: es el caso
  // que siempre genera la pregunta "¿y por qué este mes está en cero?".
  const mesSinIngresos = (data.por_mes ?? [])
    .find((m) => m.ingresos === 0 && m.ingresos_evento > 0);

  const ingresos = (data.ingresos_por_categoria ?? [])
    .map((c) => ({ label: c.label, valor: c.monto }));
  const nIngresos = (data.ingresos_por_categoria ?? []).reduce((s, c) => s + c.cantidad, 0);

  const egresosMov = (data.movimientos ?? []).filter((m) => m.tipo === 1);
  const nEgresos = egresosMov.length;
  const sinComprobante = data.advertencias?.egresos_sin_comprobante ?? 0;
  const conComprobante = nEgresos - sinComprobante;

  // Los gastos se muestran por actividad, que es como los entiende una familia.
  // De la 11ª en adelante se agrupan para que el gráfico siga siendo legible.
  const gastoTop = (() => {
    const lista = (data.por_evento ?? [])
      .filter((e) => e.gastado > 0)
      .map((e) => ({ label: e.titulo, valor: e.gastado }));
    if ((data.sin_evento?.egresos ?? 0) > 0) {
      lista.push({ label: "Gastos fuera de una actividad", valor: data.sin_evento.egresos });
    }
    lista.sort((a, b) => b.valor - a.valor);
    const top = lista.slice(0, 10);
    const resto = lista.slice(10);
    if (resto.length) {
      top.push({
        label: `Otras ${resto.length} actividades`,
        valor: resto.reduce((s, g) => s + g.valor, 0),
        tono: "stone",
      });
    }
    return top;
  })();

  const enDeficit = (data.por_evento ?? []).filter((e) => e.neto < 0);


  return (
    <div className="flex flex-col gap-5">
        <>
          {/* ── En pocas palabras ─────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <TarjetaGrande
              icon={TrendingUp} titulo="ENTRÓ" monto={r.ingresos}
              detalle="cuotas, actividades y multas" tono="emerald"
            />
            <TarjetaGrande
              icon={TrendingDown} titulo="SE GASTÓ" monto={r.egresos}
              detalle="compras y gastos de las actividades" tono="red"
            />
            <TarjetaGrande
              icon={Wallet} titulo="QUEDA EN CAJA" monto={r.saldo_final}
              detalle="dinero disponible hoy" tono="amber"
            />
          </div>

          <Nota tono="amber">
            <b>En pocas palabras:</b> al empezar el periodo teníamos {S(r.saldo_inicial)} en caja.
            Las familias aportaron {S(r.ingresos)} y se gastaron {S(r.egresos)} en las actividades
            del aula; es decir, de cada 100 soles que entraron se usaron {porcentajeGastado}.
            Por eso hoy quedan <b>{S(r.saldo_final)}</b> disponibles.
          </Nota>

          {/* Acciones */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onPdf}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors"
            >
              <FileDown size={14} /> Descargar balance en PDF
            </button>
            <button
              onClick={onCsv}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold rounded-xl transition-colors"
            >
              <Download size={14} /> Detalle en CSV
            </button>
          </div>

          {/* ── 1. Mes por mes ────────────────────────────────────────────── */}
          <Seccion
            numero={1} titulo="Mes por mes"
            bajada="Cuánto entró y cuánto se gastó en cada mes. Las barras verdes son el dinero que ingresó y las rojas lo que se gastó."
          >
            <GraficoMensual meses={data.por_mes} />

            {mesSinIngresos && (
              <Nota tono="stone">
                <b>¿Por qué {mesSinIngresos.label} aparece sin ingresos?</b> Porque las cuotas de ese
                mes se cobraron recién al mes siguiente. El dinero se anota el día que se recibe, no
                el día de la actividad. En "Actividad por actividad" se ve cuánto juntó realmente
                cada evento.
              </Nota>
            )}
          </Seccion>

          {/* ── 2. De dónde vino ──────────────────────────────────────────── */}
          <Seccion
            numero={2} titulo="¿De dónde vino el dinero?"
            bajada="Todo lo que entró a la caja durante el periodo, según su origen."
          >
            <GraficoBarras datos={ingresos} tono="emerald" />
            <Nota tono="emerald">
              Total que ingresó: <b>{S(r.ingresos)}</b> en {nIngresos} pagos recibidos. Las cuotas y
              actividades son los aportes acordados en asamblea; las multas se generan cuando un
              apoderado no asiste a una faena o guardia que le tocaba.
            </Nota>
          </Seccion>

          {/* ── 3. En qué se gastó ────────────────────────────────────────── */}
          <Seccion
            numero={3} titulo="¿En qué se gastó?"
            bajada="Las actividades donde más dinero se usó. El detalle completo, gasto por gasto, está más abajo."
          >
            <GraficoBarras datos={gastoTop} tono="red" />
            <Nota tono="red">
              Total gastado: <b>{S(r.egresos)}</b> repartidos en {nEgresos} gastos.{" "}
              <b>{conComprobante}</b> tienen su comprobante adjunto en el sistema y cualquier familia
              puede pedir verlos.
              {sinComprobante > 0 && (
                <> Quedan <b>{sinComprobante}</b> por adjuntar ({S(data.advertencias.monto_sin_comprobante)}).</>
              )}
            </Nota>
          </Seccion>

          {/* ── 4. Actividad por actividad ────────────────────────────────── */}
          <Seccion
            numero={4} titulo="Actividad por actividad"
            bajada='Cuánto se juntó y cuánto se gastó en cada una, y cuántas familias ya pagaron. Toca una fila para ver en qué se gastó.'
          >
            {data.por_evento.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">
                Sin actividades con movimientos en este periodo
              </p>
            ) : (
              <div className="overflow-x-auto -mx-1">
                <table className="w-full text-xs min-w-[720px]">
                  <thead>
                    <tr className="border-b-2 border-stone-100">
                      {[
                        ["Fecha", "text-left"], ["Actividad", "text-left"], ["Cuota", "text-right"],
                        ["Ya pagaron", "text-center"], ["Faltan", "text-center"],
                        ["Se juntó", "text-right"], ["Se gastó", "text-right"], ["Sobró/Faltó", "text-right"],
                      ].map(([h, align]) => (
                        <th key={h} className={`pb-2.5 px-2 text-[10px] font-bold text-stone-400 uppercase tracking-wide ${align}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.por_evento.map((e) => {
                      const abierto = expandido === e.evento_id;
                      const tieneGastos = (e.gastos ?? []).length > 0;
                      return (
                        <Fragment key={e.evento_id}>
                          <tr
                            onClick={() => setExpandido(abierto ? null : e.evento_id)}
                            className={`border-b border-stone-50 transition-colors cursor-pointer
                              ${abierto ? "bg-amber-50" : "hover:bg-stone-50"}`}
                          >
                            <td className="py-2 px-2 text-stone-500 whitespace-nowrap">{e.fecha ?? "—"}</td>
                            <td className="py-2 px-2 font-semibold text-stone-700">
                              <span className="flex items-center gap-1">
                                {tieneGastos && (
                                  <ChevronRight size={12} className={`text-stone-400 transition-transform ${abierto ? "rotate-90" : ""}`} />
                                )}
                                {e.titulo}
                                {e.futura && (
                                  <span className="text-[9px] font-bold bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full shrink-0">
                                    aún no ocurre
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-right text-stone-500">{e.cuota != null ? S(e.cuota) : "—"}</td>
                            <td className="py-2 px-2 text-center">
                              {e.cobrables === 0 ? (
                                <span className="text-stone-300" title="Actividad sin cuota individual: el ingreso se registró directo en caja">—</span>
                              ) : (
                                <span className="text-stone-600">
                                  <b className="text-emerald-600">{e.pagaron}</b> de {e.cobrables}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {e.cobrables === 0
                                ? <span className="text-stone-300">—</span>
                                : e.deben === 0
                                  ? <span className="text-[10px] font-bold text-emerald-600">ninguna</span>
                                  : e.futura
                                    // Todavía no les toca pagar: no se marca en rojo
                                    ? <span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{e.deben}</span>
                                    : <span className="text-[10px] font-bold bg-red-50 text-red-500 px-2 py-0.5 rounded-full">{e.deben}</span>}
                            </td>
                            <td className="py-2 px-2 text-right text-emerald-600">{S(e.recaudado)}</td>
                            <td className="py-2 px-2 text-right text-red-500">{S(e.gastado)}</td>
                            <td className={`py-2 px-2 text-right font-bold ${e.neto >= 0 ? "text-stone-700" : "text-red-500"}`}>
                              {e.neto >= 0 ? "+" : "−"}{N(Math.abs(e.neto))}
                            </td>
                          </tr>

                          {abierto && (
                            <tr className="bg-stone-50/60">
                              <td colSpan={8} className="px-4 py-3">
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide mb-2">
                                  En qué se gastó
                                </p>
                                {!tieneGastos ? (
                                  <p className="text-xs text-stone-400">Esta actividad no registra gastos en el periodo.</p>
                                ) : (
                                  <table className="w-full text-xs">
                                    <tbody>
                                      {e.gastos.map((g, i) => (
                                        <tr key={i} className="border-b border-stone-100 last:border-0">
                                          <td className="py-1.5 pr-3 text-stone-400 whitespace-nowrap w-24">{g.fecha}</td>
                                          <td className="py-1.5 pr-3 text-stone-600">{g.descripcion}</td>
                                          <td className="py-1.5 pr-3 w-20">
                                            {g.comprobante
                                              ? <span className="text-[10px] font-bold text-emerald-600">con comprobante</span>
                                              : <span className="text-[10px] text-stone-300">sin comprobante</span>}
                                          </td>
                                          <td className="py-1.5 text-right font-semibold text-red-500 w-24">{S(g.monto)}</td>
                                        </tr>
                                      ))}
                                      <tr>
                                        <td colSpan={3} className="pt-2 text-right text-[10px] font-bold text-stone-500">Total gastado:</td>
                                        <td className="pt-2 text-right font-black text-stone-700">{S(e.gastado)}</td>
                                      </tr>
                                    </tbody>
                                  </table>
                                )}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-stone-200">
                      <td colSpan={5} className="py-2.5 px-2 text-right text-[10px] font-bold text-stone-500 uppercase">Totales</td>
                      <td className="py-2.5 px-2 text-right font-black text-emerald-600">
                        {S(data.por_evento.reduce((s, e) => s + e.recaudado, 0))}
                      </td>
                      <td className="py-2.5 px-2 text-right font-black text-red-500">
                        {S(data.por_evento.reduce((s, e) => s + e.gastado, 0))}
                      </td>
                      <td className="py-2.5 px-2 text-right font-black text-stone-800">
                        {S(data.por_evento.reduce((s, e) => s + e.neto, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {enDeficit.length > 0 && (
              <Nota tono="stone">
                En {enDeficit.length === 1 ? "una actividad" : `${enDeficit.length} actividades`} se
                gastó más de lo que se juntó ({enDeficit.map((e) => e.titulo).join(", ")}). La
                diferencia salió del dinero que había en caja.
              </Nota>
            )}
          </Seccion>

          {/* ── 5. Lo que falta cobrar ────────────────────────────────────── */}
          <Seccion
            numero={5} titulo="Lo que falta cobrar"
            bajada={`Cuotas y multas pendientes al ${data.deuda.fecha_corte}. Este dinero NO está en la caja: es lo que las familias todavía deben aportar.`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-red-50 rounded-xl px-4 py-3">
                <p className="text-xl font-black text-red-500">{S(data.deuda.total)}</p>
                <p className="text-[11px] text-stone-500">atrasado · {data.deuda.padres} familias</p>
              </div>
              <div className="bg-stone-50 rounded-xl px-4 py-3">
                <p className="text-xl font-black text-stone-700">{S(data.deuda.total_cuotas)}</p>
                <p className="text-[11px] text-stone-500">son cuotas de actividades ya realizadas</p>
              </div>
              <div className="bg-stone-50 rounded-xl px-4 py-3">
                <p className="text-xl font-black text-stone-700">{S(data.deuda.total_multas)}</p>
                <p className="text-[11px] text-stone-500">son multas por inasistencia</p>
              </div>
            </div>

            {data.deuda.total_por_vencer > 0 && (
              <Nota tono="amber">
                <b>Aparte:</b> hay {S(data.deuda.total_por_vencer)} en cuotas de actividades que
                todavía no ocurren (las de los meses que vienen). <b>Eso no es deuda:</b> ninguna
                familia está atrasada con ellas, simplemente aún no llega la fecha. Por eso no se
                suma al total de arriba.
              </Nota>
            )}

            {data.deuda.detalle.length > 0 && (
              <div className="overflow-x-auto -mx-1 mt-1">
                <table className="w-full text-xs min-w-[520px]">
                  <thead>
                    <tr className="border-b-2 border-stone-100">
                      {[["Apoderado", "text-left"], ["Estudiante", "text-left"],
                        ["Cuotas", "text-right"], ["Multas", "text-right"], ["Total", "text-right"]].map(([h, a]) => (
                        <th key={h} className={`pb-2.5 px-2 text-[10px] font-bold text-stone-400 uppercase tracking-wide ${a}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.deuda.detalle.map((d) => (
                      <tr key={d.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                        <td className="py-2 px-2 font-semibold text-stone-700">{d.nombre}</td>
                        <td className="py-2 px-2 text-stone-500">{d.hijo ?? "—"}</td>
                        <td className="py-2 px-2 text-right text-stone-600">{d.cuotas > 0 ? S(d.cuotas) : "—"}</td>
                        <td className="py-2 px-2 text-right text-stone-600">{d.multas > 0 ? S(d.multas) : "—"}</td>
                        <td className="py-2 px-2 text-right font-bold text-red-500">{S(d.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Seccion>

          {/* ── 6. Las multas ─────────────────────────────────────────────── */}
          <Seccion
            numero={6} titulo="Las multas"
            bajada="Se generan cuando un apoderado no asiste a una faena o guardia que le correspondía."
          >
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
              {[
                ["Cobradas en el periodo", data.multas.cobrado_en_periodo, null, "emerald"],
                ["Pagadas en total", data.multas.pagadas.monto, data.multas.pagadas.cantidad, "stone"],
                ["Todavía sin pagar", data.multas.pendientes.monto, data.multas.pendientes.cantidad, "red"],
                ["Perdonadas", data.multas.exoneradas.monto, data.multas.exoneradas.cantidad, "amber"],
                ["Anuladas", data.multas.anuladas.monto, data.multas.anuladas.cantidad, "stone"],
              ].map(([label, monto, cant, tono]) => (
                <div key={label} className={`rounded-xl px-3 py-2.5 ${FONDO[tono]}`}>
                  <p className={`text-base font-black ${TEXTO[tono]}`}>{S(monto)}</p>
                  <p className="text-[10px] text-stone-400 leading-tight">
                    {label}{cant != null && ` · ${cant}`}
                  </p>
                </div>
              ))}
            </div>
            <Nota tono="stone">
              Lo cobrado ya está contado dentro de lo que entró. Lo que falta pagar forma parte de
              "lo que falta cobrar", no del dinero en caja.
            </Nota>
          </Seccion>

          {/* ── 7. La cuenta, paso a paso ─────────────────────────────────── */}
          <Seccion numero={7} titulo="La cuenta, paso a paso">
            <div className="flex flex-col gap-1 text-sm">
              {[
                [`Teníamos al empezar`, r.saldo_inicial, "text-stone-600"],
                ["Más: todo lo que entró", r.ingresos, "text-emerald-600"],
                ["Menos: todo lo que se gastó", r.egresos, "text-red-500"],
              ].map(([label, val, color]) => (
                <div key={label} className="flex justify-between py-2 border-b border-stone-50">
                  <span className="text-stone-500">{label}</span>
                  <span className={`font-bold ${color}`}>{S(val)}</span>
                </div>
              ))}
              <div className="flex justify-between py-3 mt-1 bg-amber-50 rounded-xl px-4">
                <span className="font-black text-amber-800">QUEDA EN CAJA HOY</span>
                <span className="font-black text-amber-700">{S(r.saldo_final)}</span>
              </div>
            </div>
            <p className="text-[11px] text-stone-400">
              Calculado con {r.n_movimientos} movimientos del periodo. No se cuentan los movimientos
              anulados ni sus contrapartes.
            </p>
          </Seccion>

          {/* ── Anexo: mes a mes con las dos miradas ──────────────────────── */}
          <Seccion
            numero="A" titulo="Anexo: mes a mes, con dos miradas"
            bajada='"Según caja" es el dinero que entró o salió ese mes: es el que da el saldo real. "Mes de la actividad" toma ese mismo dinero y lo pone en el mes del evento que lo originó.'
          >
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs min-w-[560px]">
                <thead>
                  <tr>
                    <th />
                    <th colSpan={3} className="pb-1 text-[10px] font-bold text-stone-500 uppercase tracking-wide text-center bg-amber-50 rounded-t-lg">
                      Según caja
                    </th>
                    <th colSpan={3} className="pb-1 text-[10px] font-bold text-stone-400 uppercase tracking-wide text-center">
                      Mes de la actividad
                    </th>
                  </tr>
                  <tr className="border-b-2 border-stone-100">
                    {["Mes", "Entró", "Salió", "Neto", "Entró", "Salió", "Neto"].map((h, i) => (
                      <th key={i} className={`pb-2.5 px-2 text-[10px] font-bold uppercase tracking-wide
                        ${i ? "text-right" : "text-left"} ${i >= 4 ? "text-stone-300" : "text-stone-400"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.por_mes.map((m) => (
                    <tr key={`${m.anio}-${m.mes}`} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                      <td className="py-2 px-2 font-semibold text-stone-700">{m.label}</td>
                      <td className="py-2 px-2 text-right text-emerald-600">{S(m.ingresos)}</td>
                      <td className="py-2 px-2 text-right text-red-500">{S(m.egresos)}</td>
                      <td className={`py-2 px-2 text-right font-bold ${m.neto >= 0 ? "text-stone-700" : "text-red-500"}`}>{S(m.neto)}</td>
                      <td className="py-2 px-2 text-right text-stone-400">{S(m.ingresos_evento)}</td>
                      <td className="py-2 px-2 text-right text-stone-400">{S(m.egresos_evento)}</td>
                      <td className="py-2 px-2 text-right font-semibold text-stone-400">{S(m.neto_evento)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Seccion>
        </>
    </div>
  );
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

const FONDO = {
  emerald: "bg-emerald-50", red: "bg-red-50", amber: "bg-amber-50", stone: "bg-stone-50",
};
const TEXTO = {
  emerald: "text-emerald-600", red: "text-red-500", amber: "text-amber-600", stone: "text-stone-600",
};
const BARRA = {
  emerald: "bg-emerald-500", red: "bg-red-500", amber: "bg-amber-500", stone: "bg-stone-400",
};

/** Uno de los tres números grandes de la cabecera. */
function TarjetaGrande({ icon: Icon, titulo, monto, detalle, tono }) {
  return (
    <div className={`${FONDO[tono]} rounded-2xl p-4 flex flex-col gap-1`}>
      <div className="flex items-center gap-1.5">
        <Icon size={13} className={TEXTO[tono]} />
        <p className="text-[10px] font-bold text-stone-500 tracking-wide">{titulo}</p>
      </div>
      <p className={`text-2xl font-black ${TEXTO[tono]}`}>{S(monto)}</p>
      <p className="text-[10px] text-stone-400 leading-tight">{detalle}</p>
    </div>
  );
}

/** Bloque de sección con número, título y bajada explicativa. */
function Seccion({ numero, titulo, bajada, children }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-black text-stone-800">{numero}. {titulo}</h2>
        {bajada && <p className="text-[11px] text-stone-400 mt-0.5">{bajada}</p>}
      </div>
      {children}
    </div>
  );
}

/** Párrafo explicativo con fondo suave. */
function Nota({ tono = "stone", children }) {
  return (
    <p className={`${FONDO[tono]} rounded-xl px-4 py-3 text-xs text-stone-600 leading-relaxed`}>
      {children}
    </p>
  );
}

/**
 * Barras verticales pareadas por mes. Se dibuja con divs en vez de sumar una
 * librería de gráficos: son seis pares de barras y no justifica el peso.
 */
function GraficoMensual({ meses }) {
  const max = Math.max(...meses.flatMap((m) => [m.ingresos, m.egresos]), 1);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2 h-40 border-b border-stone-100 pb-0">
        {meses.map((m) => (
          <div key={`${m.anio}-${m.mes}`} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <div className="flex items-end gap-0.5 h-full w-full justify-center">
              <div
                className="w-1/3 bg-emerald-500 rounded-t transition-all"
                style={{ height: `${Math.max((m.ingresos / max) * 100, 0.6)}%` }}
                title={`Entró ${S(m.ingresos)}`}
              />
              <div
                className="w-1/3 bg-red-500 rounded-t transition-all"
                style={{ height: `${Math.max((m.egresos / max) * 100, 0.6)}%` }}
                title={`Salió ${S(m.egresos)}`}
              />
            </div>
            <span className="text-[10px] font-bold text-stone-400">{m.label.split(" ")[0].slice(0, 3)}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 text-[10px] text-stone-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Dinero que entró
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Dinero que salió
        </span>
      </div>
    </div>
  );
}

/** Barras horizontales con etiqueta y monto. */
function GraficoBarras({ datos, tono }) {
  const max = Math.max(...datos.map((d) => Math.abs(d.valor)), 1);

  if (!datos.length) {
    return <p className="text-xs text-stone-400 py-4 text-center">Sin registros en el periodo</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {datos.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="text-[11px] text-stone-600 w-40 sm:w-52 shrink-0 truncate" title={d.label}>
            {d.label}
          </span>
          <div className="flex-1 h-3 bg-stone-100 rounded-full overflow-hidden">
            <div
              className={`h-full ${BARRA[d.tono ?? tono]} rounded-full transition-all`}
              style={{ width: `${(Math.abs(d.valor) / max) * 100}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-stone-700 w-20 text-right shrink-0">{S(d.valor)}</span>
        </div>
      ))}
    </div>
  );
}
