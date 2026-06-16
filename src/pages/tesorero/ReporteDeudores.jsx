import { useEffect, useRef, useState } from "react";
import {
  Download, Printer, Loader2, AlertCircle,
  CheckCircle, ChevronDown, Search, UserX, FileDown,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useEventos } from "../../hook/useEventos";
import { useMultas } from "../../hook/useMultas";
import { usePadres } from "../../hook/usePadres";
import useApi from "../../hook/useApi";
import {
  EVENTO_TIPO, EVENTO_TIPO_LABEL,
  MULTA_ESTADO, EVENTO_PADRE_ESTADO,
} from "../../constants/estados";
import { formatFecha, today, filtrarTexto } from "../../utils/utility";

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
  const [tab, setTab] = useState("evento"); // "evento" | "padre"

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-stone-800">Reporte de Deudores</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Consulta deudas por evento o por padre
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-stone-100 rounded-xl p-1 gap-1 w-full max-w-xs">
        {[["evento", "Por evento"], ["padre", "Por padre"]].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all
              ${tab === k ? "bg-white text-amber-600 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "evento" ? <ReporteDeudoresPorEvento /> : <ReporteDeudaPorPadre />}
    </div>
  );
}

// ── Reporte por padre ─────────────────────────────────────────────────────────
function ReporteDeudaPorPadre() {
  const [search, setSearch]       = useState("");
  const [padreSelec, setPadreSelec] = useState(null);
  const [deuda, setDeuda]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const { padres, getPadres }     = usePadres();
  const api                       = useApi();

  useEffect(() => { getPadres({ conRetirados: true }); }, []);

  const filtrados = filtrarTexto(padres, search, ["nombre", "codigo", "hijo"]).slice(0, 8);

  const descargarPDF = () => {
    if (!deuda || !padreSelec) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const hoy  = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });

    // ── Encabezado ──────────────────────────────────────────────────────────────
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Reporte de Deuda Pendiente", 14, 20);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Generado el ${hoy}`, 14, 27);
    doc.setTextColor(0, 0, 0);

    // ── Datos del padre ──────────────────────────────────────────────────────────
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Datos del padre", 14, 38);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const info = [
      ["Nombre",  padreSelec.nombre],
      ["Código",  padreSelec.codigo],
      ["Alumno",  padreSelec.hijo],
      ["Grado",   padreSelec.grado],
      ["Estado",  padreSelec.retirado ? "Retirado" : "Activo"],
    ];
    info.forEach(([label, val], i) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, 14, 45 + i * 6);
      doc.setFont("helvetica", "normal");
      doc.text(val ?? "—", 38, 45 + i * 6);
    });

    // ── Tabla de deudas ──────────────────────────────────────────────────────────
    autoTable(doc, {
      startY: 78,
      head: [["Descripción", "Tipo", "Total (S/)", "Pagado (S/)", "Saldo (S/)"]],
      body: deuda.items.map((item) => [
        item.descripcion,
        item.tipo === "multa" ? "Multa" : "Cobro",
        Number(item.monto).toFixed(2),
        Number(item.pagado).toFixed(2),
        Number(item.saldo).toFixed(2),
      ]),
      foot: [["", "Total pendiente", "", "", `S/ ${Number(deuda.total_deuda).toFixed(2)}`]],
      headStyles:  { fillColor: [245, 158, 11], textColor: 255, fontStyle: "bold", fontSize: 8 },
      footStyles:  { fillColor: [254, 243, 199], textColor: [120, 53, 15], fontStyle: "bold", fontSize: 9 },
      bodyStyles:  { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: "auto" },
        2: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right", textColor: [220, 38, 38], fontStyle: "bold" },
      },
      alternateRowStyles: { fillColor: [250, 250, 249] },
      margin: { left: 14, right: 14 },
    });

    doc.save(`deuda_${padreSelec.codigo}_${today()}.pdf`);
  };

  const seleccionar = async (p) => {
    setPadreSelec(p);
    setSearch("");
    setDeuda(null);
    setError(null);
    setLoading(true);
    try {
      const data = await api.get(`/padres/${p.id}/deuda-detalle`);
      setDeuda(data);
    } catch (e) {
      setError(e.message ?? "Error al cargar deuda");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Buscador */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-3">
        <p className="text-sm font-bold text-stone-700">Buscar padre</p>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPadreSelec(null); setDeuda(null); }}
            placeholder="Nombre, código o alumno..."
            className="w-full h-11 pl-9 pr-4 bg-stone-50 border border-stone-200 rounded-xl text-sm
              text-stone-700 outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        {/* Resultados búsqueda */}
        {search.length > 0 && !padreSelec && (
          <div className="border border-stone-100 rounded-xl overflow-hidden">
            {filtrados.length === 0 ? (
              <p className="text-xs text-stone-400 px-4 py-3 text-center">Sin resultados</p>
            ) : filtrados.map((p) => (
              <button
                key={p.id}
                onClick={() => seleccionar(p)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 transition-colors text-left border-b border-stone-50 last:border-0"
              >
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-amber-700">
                    {p.nombre.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-stone-700 truncate">{p.nombre}</p>
                  <p className="text-[10px] text-stone-400">{p.codigo} · {p.hijo}</p>
                </div>
                {p.retirado && (
                  <span className="text-[10px] font-bold bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <UserX size={10} /> Retirado
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Padre seleccionado */}
        {padreSelec && (
          <div className="flex items-center gap-3 bg-amber-50 rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
              <span className="text-xs font-black text-amber-800">
                {padreSelec.nombre.split(" ").slice(0, 2).map((w) => w[0]).join("")}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-stone-800">{padreSelec.nombre}</p>
              <p className="text-xs text-stone-500">{padreSelec.codigo} · {padreSelec.hijo} · {padreSelec.grado}</p>
            </div>
            {padreSelec.retirado && (
              <span className="text-[10px] font-bold bg-stone-200 text-stone-500 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                <UserX size={10} /> Retirado
              </span>
            )}
            <button
              onClick={() => { setPadreSelec(null); setDeuda(null); setSearch(""); }}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors shrink-0"
            >
              Cambiar
            </button>
          </div>
        )}
      </div>

      {/* Cargando */}
      {loading && (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="text-amber-400 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-sm text-red-500 font-medium">{error}</p>
        </div>
      )}

      {/* Resultado deuda */}
      {deuda && !loading && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-4">
          {/* Totales + botón PDF */}
          <div className="flex items-start justify-between gap-3">
          <div className="flex gap-5">
            <div>
              <p className="text-2xl font-black text-stone-800">{deuda.items.length}</p>
              <p className="text-xs text-stone-400">deudas pendientes</p>
            </div>
            <div>
              <p className={`text-2xl font-black ${deuda.total_deuda > 0 ? "text-red-500" : "text-emerald-500"}`}>
                S/ {Number(deuda.total_deuda).toFixed(2)}
              </p>
              <p className="text-xs text-stone-400">total pendiente</p>
            </div>
          </div>
          {deuda.items.length > 0 && (
            <button
              onClick={descargarPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600
                text-white text-xs font-bold rounded-xl transition-colors shrink-0"
            >
              <FileDown size={13} /> PDF
            </button>
          )}
          </div>

          {deuda.items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle size={18} className="text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-stone-600">Sin deudas pendientes</p>
              <p className="text-xs text-stone-400">Este padre está al día</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs min-w-[460px]">
                <thead>
                  <tr className="border-b-2 border-stone-100">
                    {["Descripción", "Tipo", "Total", "Pagado", "Saldo"].map((h, i) => (
                      <th key={h} className={`pb-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-wide px-2 ${i >= 2 ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deuda.items.map((item, i) => (
                    <tr key={i} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                      <td className="py-2.5 px-2 font-semibold text-stone-700">{item.descripcion}</td>
                      <td className="py-2.5 px-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.tipo === "multa" ? "bg-red-50 text-red-500" : "bg-blue-50 text-blue-500"
                        }`}>
                          {item.tipo === "multa" ? "Multa" : "Cobro"}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right text-stone-600">S/ {Number(item.monto).toFixed(2)}</td>
                      <td className="py-2.5 px-2 text-right text-emerald-600">S/ {Number(item.pagado).toFixed(2)}</td>
                      <td className="py-2.5 px-2 text-right font-bold text-red-500">S/ {Number(item.saldo).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-stone-200">
                    <td colSpan={4} className="py-2.5 px-2 text-right text-xs font-bold text-stone-500">Total pendiente:</td>
                    <td className="py-2.5 px-2 text-right text-sm font-black text-red-500">
                      S/ {Number(deuda.total_deuda).toFixed(2)}
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

// ── Reporte por evento (lógica original, renombrada) ─────────────────────────
function ReporteDeudoresPorEvento() {
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
          tfoot td { font-weight: 700; border-top: 2px solid #d6d3d1; background: #f5f5f4; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="encabezado">
          <div>
            <h1>Reporte de Deudores</h1>
            <div class="meta">
              Evento: <strong>${eventoInfo.titulo}</strong><br>
              Tipo: ${EVENTO_TIPO_LABEL[eventoInfo.tipo] ?? "—"} &nbsp;·&nbsp; Fecha: ${eventoInfo.fecha_inicio}<br>
              Generado el ${fechaHoy}
            </div>
          </div>
          <div class="logo">Sistema de Tesorería</div>
        </div>

        <div class="stats">
          <div class="stat">
            <div class="stat-val">${deudores.length}</div>
            <div class="stat-lbl">Deudores</div>
          </div>
          <div class="stat">
            <div class="stat-val rojo">S/ ${totalSaldo.toFixed(2)}</div>
            <div class="stat-lbl">Saldo total pendiente</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th><th>Nombre</th><th>Alumno/a</th><th>Grado</th>
              <th class="num">Total</th><th class="num">Pagado</th><th class="num">Saldo</th>
            </tr>
          </thead>
          <tbody>${filasHtml}</tbody>
          <tfoot>
            <tr>
              <td colspan="6" style="text-align:right">Total pendiente:</td>
              <td class="num deuda">S/ ${totalSaldo.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>`;

    const win = window.open("", "_blank", "width=900,height=650");
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const tiposOrden = [
    EVENTO_TIPO.GUARDIA, EVENTO_TIPO.FAENA, EVENTO_TIPO.REUNION,
    EVENTO_TIPO.CUOTA, EVENTO_TIPO.ACTIVIDAD,
  ];
  const eventosFiltrados = [...eventos].sort(
    (a, b) => tiposOrden.indexOf(a.tipo) - tiposOrden.indexOf(b.tipo),
  );

  return (
    <div className="flex flex-col gap-5">

      {/* Selector de evento */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-3">
        <p className="text-sm font-bold text-stone-700">Seleccionar evento</p>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownAbierto((v) => !v)}
            className="w-full h-11 px-4 bg-stone-50 border border-stone-200 rounded-xl text-sm
              text-stone-700 flex items-center justify-between gap-2 hover:border-amber-400 transition-colors"
          >
            <span className={eventoId ? "text-stone-800 font-medium" : "text-stone-400"}>
              {eventoId
                ? eventosFiltrados.find((e) => e.id === Number(eventoId))?.titulo ?? "Evento"
                : "Elige un evento..."}
            </span>
            <ChevronDown size={15} className="text-stone-400 shrink-0" />
          </button>

          {dropdownAbierto && (
            <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-stone-200
              rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {eventosFiltrados.map((ev) => (
                <button
                  key={ev.id}
                  onClick={() => {
                    setEventoId(String(ev.id));
                    cargarDeudores(ev.id);
                    setDropdownAbierto(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm
                    hover:bg-amber-50 transition-colors border-b border-stone-50 last:border-0
                    ${Number(eventoId) === ev.id ? "bg-amber-50 text-amber-700 font-bold" : "text-stone-700"}`}
                >
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 shrink-0">
                    {EVENTO_TIPO_LABEL[ev.tipo] ?? ev.tipo}
                  </span>
                  {ev.titulo}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Loading */}
      {(loadingEventos || loadingData) && (
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

      {/* Tabla de deudores */}
      {!loadingData && eventoInfo && (
        <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-4">
          {/* Stats + acciones */}
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex gap-5">
              <div>
                <p className="text-2xl font-black text-stone-800">{deudores.length}</p>
                <p className="text-xs text-stone-400">deudores</p>
              </div>
              <div>
                <p className="text-2xl font-black text-red-500">
                  S/ {totalSaldo.toFixed(2)}
                </p>
                <p className="text-xs text-stone-400">saldo total</p>
              </div>
            </div>

            {deudores.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleExportarCSV}
                  className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200
                    text-stone-600 text-xs font-bold rounded-xl transition-colors"
                >
                  <Download size={13} /> CSV
                </button>
                <button
                  onClick={handleImprimir}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600
                    text-white text-xs font-bold rounded-xl transition-colors"
                >
                  <Printer size={13} /> Imprimir
                </button>
              </div>
            )}
          </div>

          {deudores.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle size={18} className="text-emerald-500" />
              </div>
              <p className="text-sm font-bold text-stone-600">Sin deudores</p>
              <p className="text-xs text-stone-400">Todos al día en este evento</p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-xs min-w-[520px]">
                <thead>
                  <tr className="border-b-2 border-stone-100">
                    {["#", "Nombre", "Alumno/a", "Grado", "Total", "Pagado", "Saldo"].map((h, i) => (
                      <th
                        key={h}
                        className={`pb-2.5 text-[10px] font-bold text-stone-400 uppercase tracking-wide px-2
                          ${i >= 4 ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {deudores.map((d, i) => (
                    <tr key={i} className="border-b border-stone-50 hover:bg-stone-50 transition-colors">
                      <td className="py-2 px-2 text-stone-400">{i + 1}</td>
                      <td className="py-2 px-2">
                        <p className="font-bold text-stone-700">{d.nombre}</p>
                        <p className="text-[10px] text-stone-400">{d.codigo}</p>
                      </td>
                      <td className="py-2 px-2 text-stone-600">{d.hijo}</td>
                      <td className="py-2 px-2 text-stone-500">{d.grado}</td>
                      <td className="py-2 px-2 text-right text-stone-600">S/ {d.monto_total.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right text-emerald-600">S/ {d.pagado.toFixed(2)}</td>
                      <td className="py-2 px-2 text-right font-bold text-red-500">S/ {d.saldo.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-stone-200">
                    <td colSpan={6} className="py-2.5 px-2 text-right text-xs font-bold text-stone-500">
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
