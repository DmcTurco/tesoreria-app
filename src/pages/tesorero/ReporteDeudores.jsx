import { useEffect, useRef, useState } from "react";
import {
  Download, Printer, Loader2, AlertCircle,
  CheckCircle, ChevronDown,
} from "lucide-react";
import { useEventos } from "../../hook/useEventos";
import { useMultas } from "../../hook/useMultas";
import {
  EVENTO_TIPO, EVENTO_TIPO_LABEL,
  MULTA_ESTADO, EVENTO_PADRE_ESTADO,
} from "../../constants/estados";
import { formatFecha, today } from "../../utils/utility";

// ── CSV helpers (mismo patrón que ExportarImportar) ───────────────────────────
function csvEscape(val) {
  if (val == null) return "";
  const s = String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}
function generarCSV(filas, cabeceras) {
  return [cabeceras, ...filas].map((r) => r.map(csvEscape).join(",")).join("\r\n");
}
function descargarCSV(contenido, nombre) {
  const blob = new Blob(["﻿" + contenido], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ReporteDeudores() {
  const { eventos, getEventos, loading: loadingEventos, getEventoMovimientos } = useEventos();
  const { getMultas } = useMultas();

  const [eventoId,        setEventoId]        = useState("");
  const [eventoInfo,      setEventoInfo]      = useState(null);
  const [deudores,        setDeudores]        = useState([]);
  const [loadingData,     setLoadingData]     = useState(false);
  const [error,           setError]           = useState(null);
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownAbierto(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { getEventos(); }, []);

  // ── Carga deudores según tipo de evento ───────────────────────────────────
  const cargarDeudores = async (id) => {
    if (!id) {
      setDeudores([]);
      setEventoInfo(null);
      setError(null);
      return;
    }

    const evento = eventos.find((e) => e.id === Number(id));
    if (!evento) return;

    setEventoInfo(evento);
    setLoadingData(true);
    setError(null);

    try {
      if (evento.tipo === EVENTO_TIPO.CUOTA) {
        // Cuota: movimientos por padre → diferencia > 0 = no pagó todo
        const data = await getEventoMovimientos(Number(id));
        const lista = (data.padres ?? [])
          .filter(
            (p) =>
              p.diferencia > 0 &&
              p.estado !== EVENTO_PADRE_ESTADO.EXONERADO,
          )
          .map((p) => ({
            nombre:      p.nombre,
            codigo:      p.codigo,
            hijo:        p.hijo        ?? "—",
            grado:       p.grado       ?? "—",
            monto_total: Number(p.monto_asignado),
            pagado:      Number(p.monto_pagado),
            saldo:       Number(p.diferencia),
          }));
        setDeudores(lista);
      } else {
        // Otros eventos: multas pendientes / parciales del evento
        const multas = await getMultas({ evento_id: Number(id) });
        const lista = (multas ?? [])
          .filter(
            (m) =>
              m.estado === MULTA_ESTADO.PENDIENTE ||
              m.estado === MULTA_ESTADO.PARCIAL,
          )
          .map((m) => ({
            nombre:      m.padre?.nombre  ?? "—",
            codigo:      m.padre?.codigo  ?? "—",
            hijo:        m.padre?.hijo    ?? "—",
            grado:       m.padre?.grado   ?? "—",
            monto_total: Number(m.monto),
            pagado:      Number(m.monto_pagado ?? 0),
            saldo:       Number(m.monto) - Number(m.monto_pagado ?? 0),
            es_parcial:  m.estado === MULTA_ESTADO.PARCIAL,
          }));
        setDeudores(lista);
      }
    } catch (e) {
      setError(e.message ?? "Error al cargar datos del evento");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSelect = (e) => {
    const id = e.target.value;
    setEventoId(id);
    cargarDeudores(id);
  };

  const totalSaldo = deudores.reduce((s, d) => s + d.saldo, 0);
  const nombreArchivo = eventoInfo
    ? `deudores_${eventoInfo.titulo.replace(/\s+/g, "_")}`
    : "deudores";

  // ── Exportar CSV (abre en Excel) ──────────────────────────────────────────
  const handleExportarCSV = () => {
    if (!deudores.length) return;
    const cabeceras = [
      "N°", "Nombre", "Hijo/a", "Grado",
      "Monto total (S/)", "Pagado (S/)", "Saldo pendiente (S/)",
    ];
    const filas = deudores.map((d, i) => [
      i + 1, d.nombre, d.hijo, d.grado,
      d.monto_total.toFixed(2),
      d.pagado.toFixed(2),
      d.saldo.toFixed(2),
    ]);
    descargarCSV(generarCSV(filas, cabeceras), `${nombreArchivo}.csv`);
  };

  // ── Imprimir / Guardar como PDF ───────────────────────────────────────────
  const handleImprimir = () => {
    if (!eventoInfo) return;

    const fechaHoy = new Date().toLocaleDateString("es-PE", {
      day: "2-digit", month: "long", year: "numeric",
    });

    const filasHtml = deudores
      .map(
        (d, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${d.nombre}</strong><br><span class="sub">${d.codigo}</span></td>
          <td>${d.hijo}</td>
          <td>${d.grado}</td>
          <td class="num">S/ ${d.monto_total.toFixed(2)}</td>
          <td class="num ok">S/ ${d.pagado.toFixed(2)}</td>
          <td class="num deuda">S/ ${d.saldo.toFixed(2)}</td>
        </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Reporte de Deudores – ${eventoInfo.titulo}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 12px; padding: 28px; color: #1c1917; }
          .encabezado { display: flex; justify-content: space-between; align-items: flex-start;
                        border-bottom: 2px solid #e7e5e4; padding-bottom: 14px; margin-bottom: 18px; }
          .encabezado h1 { font-size: 18px; font-weight: 900; margin-bottom: 4px; }
          .encabezado .meta { font-size: 11px; color: #78716c; line-height: 1.7; }
          .encabezado .logo { font-size: 11px; text-align: right; color: #a8a29e; }
          .stats { display: flex; gap: 16px; margin-bottom: 18px; }
          .stat { background: #f5f5f4; border-radius: 8px; padding: 10px 18px; }
          .stat-val { font-size: 20px; font-weight: 900; }
          .stat-val.rojo { color: #dc2626; }
          .stat-lbl { font-size: 10px; color: #78716c; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; }
          thead tr { background: #f5f5f4; }
          th { padding: 8px 10px; text-align: left; font-size: 10px; font-weight: 700;
              color: #78716c; text-transform: uppercase; border-bottom: 2px solid #d6d3d1; }
          td { padding: 8px 10px; border-bottom: 1px solid #f0efee; vertical-align: middle; }
          tr:nth-child(even) td { background: #fafaf9; }
          .sub { font-size: 10px; color: #a8a29e; font-weight: normal; }
          .num { text-align: right; }
          .ok   { color: #16a34a; }
          .deuda { color: #dc2626; font-weight: 700; }
          tfoot td { font-weight: 700; background: #f5f5f4; border-top: 2px solid #d6d3d1; padding: 10px; }
          .pie { margin-top: 20px; color: #a8a29e; font-size: 10px; text-align: right;
                border-top: 1px solid #e7e5e4; padding-top: 10px; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>
        <div class="encabezado">
          <div>
            <h1>Reporte de Deudores</h1>
            <div class="meta">
              <div><strong>Evento:</strong> ${eventoInfo.titulo}</div>
              <div><strong>Tipo:</strong> ${EVENTO_TIPO_LABEL[eventoInfo.tipo]}&nbsp;&nbsp;|&nbsp;&nbsp;<strong>Fecha:</strong> ${formatFecha(eventoInfo.fecha_inicio)}</div>
              <div><strong>Generado:</strong> ${fechaHoy}</div>
            </div>
          </div>
          <div class="logo">Sistema de Tesorería<br>APAFA</div>
        </div>

        <div class="stats">
          <div class="stat">
            <div class="stat-val">${deudores.length}</div>
            <div class="stat-lbl">Padres con deuda</div>
          </div>
          <div class="stat">
            <div class="stat-val rojo">S/ ${totalSaldo.toFixed(2)}</div>
            <div class="stat-lbl">Total pendiente</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Nombre del padre / madre</th>
              <th>Hijo/a</th>
              <th>Grado</th>
              <th style="text-align:right">Monto total</th>
              <th style="text-align:right">Pagado</th>
              <th style="text-align:right">Saldo pendiente</th>
            </tr>
          </thead>
          <tbody>${filasHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="6" style="text-align:right">TOTAL PENDIENTE:</td>
              <td class="num deuda">S/ ${totalSaldo.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>

        <div class="pie">Sistema de Tesorería APAFA &nbsp;·&nbsp; ${fechaHoy}</div>
        <script>window.print();<\/script>
      </body>
      </html>`;

    const ventana = window.open("", "_blank");
    ventana.document.write(html);
    ventana.document.close();
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-stone-800">Reporte de Deudores</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Selecciona un evento para ver qué padres tienen saldo pendiente
        </p>
      </div>

      {/* Selector de evento */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-3">
        <p className="text-sm font-bold text-stone-700">Evento</p>
        <div className="relative" ref={dropdownRef}>
          {/* Botón trigger */}
          <button
            onClick={() => !loadingEventos && setDropdownAbierto((v) => !v)}
            disabled={loadingEventos}
            className={`w-full h-11 pl-4 pr-10 bg-stone-50 border rounded-xl text-sm text-left
              transition-colors disabled:opacity-50
              ${dropdownAbierto ? "border-amber-400" : "border-stone-200"}
              ${eventoInfo ? "text-stone-700" : "text-stone-400"}`}
          >
            {eventoInfo ? (
              <span className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 shrink-0">
                  {EVENTO_TIPO_LABEL[eventoInfo.tipo]}
                </span>
                <span className="truncate">{eventoInfo.titulo}</span>
                {eventoInfo.fecha_inicio?.slice(0, 10) > today() && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 shrink-0">
                    Próximo
                  </span>
                )}
              </span>
            ) : (
              "— Selecciona un evento —"
            )}
          </button>
          <ChevronDown
            size={15}
            className={`absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none transition-transform ${dropdownAbierto ? "rotate-180" : ""}`}
          />

          {/* Lista desplegable */}
          {dropdownAbierto && (
            <div className="absolute z-20 top-full mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
              {/* Opción vacía */}
              <button
                onClick={() => { handleSelect({ target: { value: "" } }); setDropdownAbierto(false); }}
                className="w-full px-4 py-2.5 text-left text-sm text-stone-400 hover:bg-stone-50 transition-colors"
              >
                — Selecciona un evento —
              </button>

              {eventos.map((e) => {
                const futuro = e.fecha_inicio && e.fecha_inicio.slice(0, 10) > today();
                const seleccionado = String(e.id) === String(eventoId);
                return (
                  <button
                    key={e.id}
                    onClick={() => { handleSelect({ target: { value: e.id } }); setDropdownAbierto(false); }}
                    className={`w-full px-4 py-2.5 text-left transition-colors flex items-center gap-2
                      ${seleccionado ? "bg-amber-50" : futuro ? "bg-blue-50/60 hover:bg-blue-50" : "hover:bg-stone-50"}`}
                  >
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 shrink-0">
                      {EVENTO_TIPO_LABEL[e.tipo]}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-stone-700 block truncate">
                        {e.titulo}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {formatFecha(e.fecha_inicio)}
                      </span>
                    </span>
                    {futuro && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 shrink-0">
                        Próximo
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cargando */}
      {loadingData && (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="text-amber-400 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loadingData && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* Resultado */}
      {!loadingData && eventoInfo && !error && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-4">

          {/* Stats + botones de exportar */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex gap-5">
              <div>
                <p className="text-2xl font-black text-stone-800">{deudores.length}</p>
                <p className="text-xs text-stone-400">padres con deuda</p>
              </div>
              <div>
                <p className="text-2xl font-black text-red-500">
                  S/ {totalSaldo.toFixed(2)}
                </p>
                <p className="text-xs text-stone-400">total pendiente</p>
              </div>
            </div>

            {deudores.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleExportarCSV}
                  className="flex items-center gap-1.5 h-9 px-3 bg-stone-100 hover:bg-stone-200
                    text-stone-600 text-xs font-bold rounded-xl transition-colors"
                >
                  <Download size={13} /> Excel / CSV
                </button>
                <button
                  onClick={handleImprimir}
                  className="flex items-center gap-1.5 h-9 px-3 bg-amber-500 hover:bg-amber-600
                    text-white text-xs font-bold rounded-xl transition-colors"
                >
                  <Printer size={13} /> PDF / Imprimir
                </button>
              </div>
            )}
          </div>

          {/* Tabla / vacío */}
          {deudores.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle size={18} className="text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-stone-600">Todos al día</p>
              <p className="text-xs text-stone-400">
                No hay padres con deuda pendiente en este evento
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs min-w-[540px]">
                <thead>
                  <tr className="border-b-2 border-stone-100">
                    {["#", "Nombre", "Hijo/a", "Grado", "Total", "Pagado", "Saldo"].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`pb-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-wide px-2
                            ${i >= 4 ? "text-right" : "text-left"}`}
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {deudores.map((d, i) => (
                    <tr
                      key={i}
                      className="border-b border-stone-50 hover:bg-stone-50 transition-colors"
                    >
                      <td className="py-2.5 px-2 text-stone-400">{i + 1}</td>
                      <td className="py-2.5 px-2">
                        <p className="font-bold text-stone-700">{d.nombre}</p>
                        <p className="text-stone-400 text-[10px]">{d.codigo}</p>
                      </td>
                      <td className="py-2.5 px-2 text-stone-600">{d.hijo}</td>
                      <td className="py-2.5 px-2 text-stone-600">{d.grado}</td>
                      <td className="py-2.5 px-2 text-right text-stone-600">
                        S/ {d.monto_total.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 text-right text-emerald-600">
                        S/ {d.pagado.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-bold text-red-500">
                        S/ {d.saldo.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-stone-200">
                    <td
                      colSpan={6}
                      className="py-2.5 px-2 text-right text-xs font-bold text-stone-500"
                    >
                      Total pendiente:
                    </td>
                    <td className="py-2.5 px-2 text-right text-sm font-black text-red-500">
                      S/ {totalSaldo.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
