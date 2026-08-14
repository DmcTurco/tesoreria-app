import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─────────────────────────────────────────────────────────────────────────────
// Balance de tesorería en PDF.
//
// El documento está pensado para leerse en asamblea, así que las primeras
// páginas usan lenguaje corriente y gráficos; el detalle contable completo va
// al final, en los anexos, para quien quiera revisarlo cifra por cifra.
//
// Vive fuera del componente para que la pantalla quede legible y para poder
// generar el documento sin montar React (útil al probar el resultado).
// ─────────────────────────────────────────────────────────────────────────────

const S = (n) => `S/ ${Number(n ?? 0).toFixed(2)}`;
const N = (n) => Number(n ?? 0).toFixed(2);

// Paleta
const AMBAR = [245, 158, 11];
const VERDE = [22, 163, 74];
const ROJO = [220, 38, 38];
const GRIS = [120, 113, 108];
const GRIS_CLARO = [214, 211, 209];
const TINTA = [41, 37, 36];

// ── Texto seguro para jsPDF ───────────────────────────────────────────────────
// Las fuentes estándar de jsPDF (Helvetica y compañía) solo saben dibujar
// caracteres de la tabla cp1252 / Latin-1. Los emojis de los títulos salen como
// bytes sueltos ("Ø>Ýé") porque no existen en esa tabla. En vez de incrustar una
// fuente Unicode completa (pesa megas y aun así no dibuja emojis a color), se
// quitan del PDF los caracteres que la fuente no puede representar.
// Tildes, ñ, ¿, ¡, comillas tipográficas y guiones largos SÍ están en cp1252,
// así que se conservan intactos.
const CP1252 = /[\x20-\x7E\xA0-\xFFŒœŠšŸŽžƒˆ˜–—‘’‚“”„†‡•…‰‹›€™]/;

export function pdfText(valor, alternativa = "—") {
  if (valor == null) return alternativa;
  const limpio = String(valor)
    .normalize("NFC")
    .split("")
    .filter((ch) => CP1252.test(ch))
    .join("")
    // Restos típicos al quitar emojis: espacios dobles y separadores sueltos
    .replace(/\s+/g, " ")
    .replace(/^[\s*·–—-]+|[\s*·–—-]+$/g, "")
    .trim();
  return limpio || alternativa;
}

/**
 * Los comprobantes suelen ser enlaces largos de Drive. Impresos no sirven de
 * nada (nadie va a tipear una URL de 80 caracteres) y hacen que cada fila
 * ocupe siete líneas. En el PDF se muestra solo si existe o no; los enlaces
 * completos quedan en la exportación CSV.
 */
function comprobanteCorto(valor) {
  const texto = pdfText(valor, "");
  if (!texto) return "—";
  if (/^https?:\/\//i.test(texto)) return "Enlace";
  return texto.length > 16 ? `${texto.slice(0, 15)}…` : texto;
}

function fechaLarga(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return new Date(+y, +m - 1, +d).toLocaleDateString("es-PE", {
    day: "2-digit", month: "long", year: "numeric",
  });
}

/** Recorta un texto para que no pase de `ancho` milímetros. */
function recortar(doc, texto, ancho) {
  let t = pdfText(texto);
  if (doc.getTextWidth(t) <= ancho) return t;
  while (t.length > 1 && doc.getTextWidth(`${t}…`) > ancho) t = t.slice(0, -1);
  return `${t}…`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Gráficos
//
// jsPDF no trae gráficos, pero para lo que hace falta acá (comparar barras)
// alcanza con rectángulos y texto. Se dibuja a mano en vez de sumar una
// librería de charts: no requiere canvas ni imágenes, y el PDF sale liviano
// y con texto seleccionable.
// ─────────────────────────────────────────────────────────────────────────────

/** Barras verticales pareadas: entradas vs. salidas por mes. */
function graficoMensual(doc, { x, y, ancho, alto, meses }) {
  const valores = meses.flatMap((m) => [m.ingresos, m.egresos]);
  const max = Math.max(...valores, 1);

  // Líneas guía horizontales con su referencia en soles
  doc.setDrawColor(...GRIS_CLARO);
  doc.setLineWidth(0.15);
  doc.setFontSize(6);
  doc.setTextColor(...GRIS);
  for (let i = 0; i <= 2; i++) {
    const gy = y + alto - (alto * i) / 2;
    doc.line(x, gy, x + ancho, gy);
    doc.text(`${Math.round((max * i) / 2)}`, x - 2, gy + 1.5, { align: "right" });
  }

  const anchoGrupo = ancho / Math.max(meses.length, 1);
  const anchoBarra = Math.min(8, anchoGrupo / 2.8);

  meses.forEach((m, i) => {
    const centro = x + anchoGrupo * i + anchoGrupo / 2;
    const hIng = (m.ingresos / max) * alto;
    const hEgr = (m.egresos / max) * alto;

    doc.setFillColor(...VERDE);
    doc.rect(centro - anchoBarra - 0.7, y + alto - hIng, anchoBarra, Math.max(hIng, 0.4), "F");
    doc.setFillColor(...ROJO);
    doc.rect(centro + 0.7, y + alto - hEgr, anchoBarra, Math.max(hEgr, 0.4), "F");

    doc.setFontSize(6.5);
    doc.setTextColor(...GRIS);
    doc.setFont("helvetica", "bold");
    doc.text(pdfText(m.label).split(" ")[0].slice(0, 3), centro, y + alto + 4, { align: "center" });
    doc.setFont("helvetica", "normal");
  });

  // Leyenda
  const ly = y + alto + 9;
  doc.setFillColor(...VERDE);
  doc.rect(x, ly - 2.4, 3, 3, "F");
  doc.setFontSize(7);
  doc.setTextColor(...TINTA);
  doc.text("Dinero que entró", x + 4.5, ly);
  doc.setFillColor(...ROJO);
  doc.rect(x + 34, ly - 2.4, 3, 3, "F");
  doc.text("Dinero que salió", x + 38.5, ly);

  return ly + 3;
}

/** Barras horizontales con etiqueta a la izquierda y monto a la derecha. */
function graficoBarras(doc, { x, y, ancho, datos, color, anchoEtiqueta = 58, altoFila = 8 }) {
  const max = Math.max(...datos.map((d) => Math.abs(d.valor)), 1);
  const anchoMonto = 24;
  const anchoPista = ancho - anchoEtiqueta - anchoMonto;

  datos.forEach((d, i) => {
    const fy = y + i * altoFila;

    doc.setFontSize(7.5);
    doc.setTextColor(...TINTA);
    doc.text(recortar(doc, d.label, anchoEtiqueta - 3), x, fy + 3.4);

    const bx = x + anchoEtiqueta;
    doc.setFillColor(245, 245, 244);
    doc.rect(bx, fy, anchoPista, 4.4, "F");

    const largo = (Math.abs(d.valor) / max) * anchoPista;
    doc.setFillColor(...(d.color ?? color));
    doc.rect(bx, fy, Math.max(largo, 0.6), 4.4, "F");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TINTA);
    doc.text(S(d.valor), x + ancho, fy + 3.4, { align: "right" });
    doc.setFont("helvetica", "normal");
  });

  return y + datos.length * altoFila;
}

/** Tarjetón con un número grande y su explicación. */
function tarjeta(doc, { x, y, ancho, alto, titulo, monto, detalle, color, relleno }) {
  doc.setFillColor(...relleno);
  doc.roundedRect(x, y, ancho, alto, 2.5, 2.5, "F");

  doc.setFontSize(8);
  doc.setTextColor(...GRIS);
  doc.setFont("helvetica", "normal");
  doc.text(titulo, x + ancho / 2, y + 7, { align: "center" });

  doc.setFontSize(16);
  doc.setTextColor(...color);
  doc.setFont("helvetica", "bold");
  doc.text(S(monto), x + ancho / 2, y + 16, { align: "center" });

  if (detalle) {
    doc.setFontSize(6.5);
    doc.setTextColor(...GRIS);
    doc.setFont("helvetica", "normal");
    doc.text(detalle, x + ancho / 2, y + 21.5, { align: "center" });
  }
}

/** Título de sección con número y una bajada explicativa opcional. */
function titulo(doc, { x, y, numero, texto, bajada, ancho }) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...TINTA);
  doc.text(`${numero}. ${texto}`, x, y);

  if (bajada) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRIS);
    const lineas = doc.splitTextToSize(bajada, ancho);
    doc.text(lineas, x, y + 5);
    doc.setTextColor(...TINTA);
    return y + 5 + lineas.length * 3.6;
  }
  doc.setTextColor(...TINTA);
  return y + 3;
}

/** Párrafo en lenguaje corriente, con fondo suave para que destaque. */
function recuadroTexto(doc, { x, y, ancho, texto, relleno = [254, 252, 232] }) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const lineas = doc.splitTextToSize(texto, ancho - 8);
  const alto = lineas.length * 4.2 + 7;
  doc.setFillColor(...relleno);
  doc.roundedRect(x, y, ancho, alto, 2, 2, "F");
  doc.setTextColor(...TINTA);
  doc.text(lineas, x + 4, y + 6);
  return y + alto;
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Construye el balance en PDF y devuelve el documento jsPDF.
 * @param {object} data    respuesta de GET /api/reportes/balance
 * @param {object} firmas  { institucion, subtitulo, tesorero, presidente, fiscal }
 * @param {string} emitido fecha de emisión en formato YYYY-MM-DD
 */
export function construirBalancePDF(data, firmas = {}, emitido) {
  const r = data.resumen;
  const hoy = emitido ?? new Date().toISOString().slice(0, 10);
  const eventos = data.por_evento ?? [];
  const meses = data.por_mes ?? [];

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 16;
  const ANCHO = W - M * 2;
  const PIE = 18; // espacio reservado para el pie de página
  const institucion = pdfText(firmas.institucion, "TESORERÍA");

  /**
   * Salta de página solo si el bloque que viene no entra en lo que queda.
   * Así el documento fluye y no deja medias hojas en blanco.
   */
  const sitio = (yActual, necesario) =>
    (yActual + necesario > H - PIE ? (doc.addPage(), 18) : yActual);

  // ═══ PÁGINA 1 · El dinero en pocas palabras ═══════════════════════════════
  doc.setFillColor(...AMBAR);
  doc.rect(0, 0, W, 5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...TINTA);
  doc.text("BALANCE DE TESORERÍA", W / 2, 22, { align: "center" });

  doc.setFontSize(12);
  doc.setTextColor(...AMBAR);
  doc.text(pdfText(data.periodo.label).toUpperCase(), W / 2, 30, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...GRIS);
  if (firmas.subtitulo) doc.text(pdfText(firmas.subtitulo, ""), W / 2, 37, { align: "center" });
  doc.setFontSize(8);
  doc.text(
    `Del ${fechaLarga(data.periodo.desde)} al ${fechaLarga(data.periodo.hasta)}  ·  Presentado el ${fechaLarga(hoy)}`,
    W / 2, 43, { align: "center" },
  );

  // Los tres números que todos quieren saber
  const anchoTarjeta = (ANCHO - 8) / 3;
  tarjeta(doc, {
    x: M, y: 52, ancho: anchoTarjeta, alto: 26,
    titulo: "ENTRÓ", monto: r.ingresos, detalle: "cuotas, actividades y multas",
    color: VERDE, relleno: [220, 252, 231],
  });
  tarjeta(doc, {
    x: M + anchoTarjeta + 4, y: 52, ancho: anchoTarjeta, alto: 26,
    titulo: "SE GASTÓ", monto: r.egresos, detalle: "compras y gastos de las actividades",
    color: ROJO, relleno: [254, 226, 226],
  });
  tarjeta(doc, {
    x: M + (anchoTarjeta + 4) * 2, y: 52, ancho: anchoTarjeta, alto: 26,
    titulo: "QUEDA EN CAJA", monto: r.saldo_final, detalle: "dinero disponible hoy",
    color: [180, 83, 9], relleno: [254, 243, 199],
  });

  // Explicación en lenguaje corriente
  const porcentajeGastado = r.ingresos > 0 ? Math.round((r.egresos / r.ingresos) * 100) : 0;
  let y = recuadroTexto(doc, {
    x: M, y: 84, ancho: ANCHO,
    texto:
      `En pocas palabras: al empezar el periodo teníamos ${S(r.saldo_inicial)} en caja. `
      + `Durante estos meses las familias aportaron ${S(r.ingresos)} y se gastaron ${S(r.egresos)} `
      + `en las actividades del aula; es decir, de cada 100 soles que entraron se usaron ${porcentajeGastado}. `
      + `Por eso hoy quedan ${S(r.saldo_final)} disponibles.`,
  });

  // Gráfico mes a mes
  y = titulo(doc, {
    x: M, y: y + 12, numero: 1, ancho: ANCHO,
    texto: "Mes por mes",
    bajada: "Cuánto entró y cuánto se gastó en cada mes. Las barras verdes son el dinero que ingresó y las rojas lo que se gastó.",
  });

  y = graficoMensual(doc, { x: M + 10, y: y + 4, ancho: ANCHO - 12, alto: 38, meses });

  // Aviso: el dinero se cobra después del evento
  const mesSinIngresos = meses.find((m) => m.ingresos === 0 && m.ingresos_evento > 0);
  if (mesSinIngresos) {
    y = recuadroTexto(doc, {
      x: M, y: y + 6, ancho: ANCHO, relleno: [245, 245, 244],
      texto:
        `¿Por qué ${pdfText(mesSinIngresos.label)} aparece sin ingresos? Porque las cuotas de ese mes se `
        + `cobraron recién al mes siguiente. El dinero se anota el día que se recibe, no el día de la actividad. `
        + `En la sección "Actividad por actividad" se ve cuánto juntó realmente cada evento.`,
    });
  }

  // Lo que falta cobrar
  if ((data.deuda?.total ?? 0) > 0) {
    y = recuadroTexto(doc, {
      x: M, y: y + 6, ancho: ANCHO, relleno: [254, 226, 226],
      texto:
        `Además, faltan cobrar ${S(data.deuda.total)} a ${data.deuda.padres} familias por actividades `
        + `que ya se realizaron. Ese dinero todavía NO está en caja: es lo que se debe. `
        + `El detalle está más adelante.`,
    });
  }

  // ═══ De dónde vino y en qué se fue ════════════════════════════════════════
  const nIngresos = (data.ingresos_por_categoria ?? []).reduce((s, c) => s + c.cantidad, 0);

  y = sitio(y + 12, 60);
  y = titulo(doc, {
    x: M, y, numero: 2, ancho: ANCHO,
    texto: "¿De dónde vino el dinero?",
    bajada: "Todo lo que entró a la caja durante el periodo, según su origen.",
  });

  y = graficoBarras(doc, {
    x: M, y: y + 5, ancho: ANCHO,
    datos: (data.ingresos_por_categoria ?? []).map((c) => ({
      label: pdfText(c.label),
      valor: c.monto,
    })),
    color: VERDE,
  });

  y = recuadroTexto(doc, {
    x: M, y: y + 5, ancho: ANCHO, relleno: [240, 253, 244],
    texto:
      `Total que ingresó: ${S(r.ingresos)} en ${nIngresos} pagos recibidos. `
      + `Las cuotas y actividades son los aportes acordados en asamblea; las multas se generan `
      + `cuando un apoderado no asiste a una faena o guardia que le tocaba.`,
  });

  // En qué se gastó — por actividad, que es como lo entiende un padre
  const gastoPorEvento = eventos
    .filter((e) => e.gastado > 0)
    .map((e) => ({ label: pdfText(e.titulo, `Evento #${e.evento_id}`), valor: e.gastado }));

  if ((data.sin_evento?.egresos ?? 0) > 0) {
    gastoPorEvento.push({ label: "Gastos fuera de una actividad", valor: data.sin_evento.egresos });
  }
  gastoPorEvento.sort((a, b) => b.valor - a.valor);
  const gastoTop = gastoPorEvento.slice(0, 10);
  const gastoResto = gastoPorEvento.slice(10);
  if (gastoResto.length) {
    gastoTop.push({
      label: `Otras ${gastoResto.length} actividades`,
      valor: gastoResto.reduce((s, g) => s + g.valor, 0),
      color: GRIS,
    });
  }

  y = sitio(y + 12, 30 + gastoTop.length * 8);
  y = titulo(doc, {
    x: M, y, numero: 3, ancho: ANCHO,
    texto: "¿En qué se gastó?",
    bajada: "Las actividades donde más dinero se usó. El detalle completo, gasto por gasto, está en la sección 5.",
  });

  y = graficoBarras(doc, {
    x: M, y: y + 5, ancho: ANCHO, datos: gastoTop, color: ROJO,
  });

  // Ojo: no se afirma que todo gasto tenga comprobante. El sistema sabe
  // cuántos lo tienen adjunto y decirlo tal cual es más defendible en asamblea
  // que una promesa que el propio anexo desmiente.
  const nEgresos = (data.movimientos ?? []).filter((m) => m.tipo === 1).length;
  const conComprobante = nEgresos - (data.advertencias?.egresos_sin_comprobante ?? 0);

  y = recuadroTexto(doc, {
    x: M, y: y + 5, ancho: ANCHO, relleno: [254, 242, 242],
    texto:
      `Total gastado: ${S(r.egresos)} repartidos en ${nEgresos} gastos. `
      + `${conComprobante} tienen su comprobante adjunto en el sistema (boleta, factura o foto del recibo) `
      + `y cualquier familia puede pedir verlos. El detalle de cada gasto está en la sección 5.`,
  });

  // ═══ Actividad por actividad ══════════════════════════════════════════════
  y = sitio(y + 12, 60);
  y = titulo(doc, {
    x: M, y, numero: 4, ancho: ANCHO,
    texto: "Actividad por actividad",
    bajada:
      "Cuánto se juntó y cuánto se gastó en cada actividad, y cuántas familias ya pagaron. "
      + "La última columna dice si sobró (+) o si hizo falta poner de la caja (-).",
  });

  autoTable(doc, {
    startY: y + 4,
    head: [["Fecha", "Actividad", "Cuota", "Ya pagaron", "Faltan", "Se juntó", "Se gastó", "Sobró/Faltó"]],
    body: eventos.length
      ? eventos.map((e) => [
          e.fecha ?? "—",
          pdfText(e.titulo, `Evento #${e.evento_id}`) + (e.futura ? "  (aún no ocurre)" : ""),
          e.cuota != null ? N(e.cuota) : "—",
          e.cobrables === 0 ? "—" : `${e.pagaron} de ${e.cobrables}`,
          e.cobrables === 0 ? "—" : (e.deben > 0 ? `${e.deben}` : "ninguna"),
          N(e.recaudado),
          N(e.gastado),
          `${e.neto >= 0 ? "+" : "-"}${N(Math.abs(e.neto))}`,
        ])
      : [["", "Sin actividades con movimientos en el periodo", "", "", "", "", "", ""]],
    foot: [[
      // La columna "Faltan" no se totaliza: sumarla contaría a la misma familia
      // una vez por actividad y daría un número que nadie sabría interpretar.
      // El monto real por cobrar está en la sección 6.
      "", "TOTALES", "", "", "—",
      N(eventos.reduce((s, e) => s + e.recaudado, 0)),
      N(eventos.reduce((s, e) => s + e.gastado, 0)),
      N(eventos.reduce((s, e) => s + e.neto, 0)),
    ]],
    headStyles: { fillColor: AMBAR, textColor: 255, fontStyle: "bold", fontSize: 7.5 },
    footStyles: { fillColor: [254, 243, 199], textColor: [120, 53, 15], fontStyle: "bold", fontSize: 7.5 },
    bodyStyles: { fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 13, halign: "right" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 14, halign: "center" },
      5: { cellWidth: 18, halign: "right", textColor: VERDE },
      6: { cellWidth: 18, halign: "right", textColor: ROJO },
      7: { cellWidth: 21, halign: "right", fontStyle: "bold" },
    },
    didParseCell: (hook) => {
      // Marca en rojo las actividades donde se gastó más de lo que se juntó
      if (hook.section === "body" && hook.column.index === 7
        && String(hook.cell.raw ?? "").startsWith("-")) {
        hook.cell.styles.textColor = ROJO;
      }
    },
    showFoot: "lastPage",
    alternateRowStyles: { fillColor: [250, 250, 249] },
    margin: { left: M, right: M },
  });

  const enDeficit = eventos.filter((e) => e.neto < 0);
  y = sitio(doc.lastAutoTable.finalY + 6, 24);
  {
    y = recuadroTexto(doc, {
      x: M, y, ancho: ANCHO, relleno: [245, 245, 244],
      texto: enDeficit.length
        ? `En ${enDeficit.length === 1 ? "una actividad" : `${enDeficit.length} actividades`} se gastó más de lo que se juntó `
          + `(${enDeficit.map((e) => pdfText(e.titulo)).join(", ")}). `
          + `La diferencia salió del dinero que había en caja.`
        : "En todas las actividades el dinero juntado alcanzó para cubrir los gastos.",
    });
  }

  // ═══ PÁGINA 4 · Detalle de gastos ═════════════════════════════════════════
  const filasGasto = [];
  eventos.forEach((e) => {
    const nombre = pdfText(e.titulo, `Evento #${e.evento_id}`);
    (e.gastos ?? []).forEach((g, i) => {
      filasGasto.push([
        i === 0 ? nombre : "",
        g.fecha,
        pdfText(g.descripcion),
        comprobanteCorto(g.comprobante),
        N(g.monto),
      ]);
    });
    if ((e.gastos ?? []).length > 1) {
      filasGasto.push(["", "", `Subtotal ${nombre}`, "", N(e.gastado)]);
    }
  });

  // Gastos que no pertenecen a ninguna actividad
  const gastosSueltos = (data.movimientos ?? [])
    .filter((m) => m.tipo === 1 && !m.evento_id)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));

  gastosSueltos.forEach((m, i) => {
    filasGasto.push([
      i === 0 ? "(Fuera de una actividad)" : "",
      m.fecha,
      pdfText(m.descripcion),
      comprobanteCorto(m.comprobante),
      N(m.monto),
    ]);
  });
  if (gastosSueltos.length > 1) {
    filasGasto.push([
      "", "", "Subtotal fuera de una actividad", "",
      N(gastosSueltos.reduce((s, m) => s + m.monto, 0)),
    ]);
  }

  if (filasGasto.length) {
    y = sitio(y + 12, 70);
    y = titulo(doc, {
      x: M, y, numero: 5, ancho: ANCHO,
      texto: "En qué se gastó, uno por uno",
      bajada: "Todos los gastos del periodo. \"Enlace\" quiere decir que el comprobante está guardado y se puede ver.",
    });

    autoTable(doc, {
      startY: y + 4,
      head: [["Actividad", "Fecha", "Concepto del gasto", "Comprob.", "Monto (S/)"]],
      body: filasGasto,
      foot: [["", "", "TOTAL GASTADO EN EL PERIODO", "", N(r.egresos)]],
      headStyles: { fillColor: ROJO, textColor: 255, fontStyle: "bold", fontSize: 8 },
      footStyles: { fillColor: [254, 226, 226], textColor: [127, 29, 29], fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: {
        0: { cellWidth: 42, fontStyle: "bold" },
        1: { cellWidth: 18 },
        2: { cellWidth: "auto" },
        3: { cellWidth: 18 },
        4: { cellWidth: 22, halign: "right" },
      },
      didParseCell: (hook) => {
        if (hook.section === "body" && String(hook.row.raw[2] ?? "").startsWith("Subtotal")) {
          hook.cell.styles.fillColor = [245, 245, 244];
          hook.cell.styles.fontStyle = "bold";
        }
      },
      showFoot: "lastPage",
      alternateRowStyles: { fillColor: [252, 252, 251] },
      margin: { left: M, right: M },
    });
    y = doc.lastAutoTable.finalY;
  }

  // ═══ Lo que falta cobrar ══════════════════════════════════════════════════
  const deudores = data.deuda?.detalle ?? [];

  y = sitio(y + 12, 70);
  y = titulo(doc, {
    x: M, y, numero: 6, ancho: ANCHO,
    texto: "Lo que falta cobrar",
    bajada:
      `Cuotas de actividades ya realizadas y multas pendientes al ${fechaLarga(data.deuda?.fecha_corte)}. `
      + "Este dinero NO está en la caja: es lo que las familias todavía deben aportar.",
  });

  // Las cuotas de actividades que aún no ocurren se aclaran antes de la tabla,
  // para que nadie lea la lista pensando que esas familias están atrasadas.
  if ((data.deuda?.total_por_vencer ?? 0) > 0) {
    y = recuadroTexto(doc, {
      x: M, y: y + 4, ancho: ANCHO, relleno: [254, 243, 199],
      texto:
        `Aparte de lo anterior hay ${S(data.deuda.total_por_vencer)} en cuotas de actividades que `
        + `todavía no se realizan. Eso NO es deuda: ninguna familia está atrasada con ellas, `
        + `simplemente aún no llega la fecha. Por eso no se suma al total de esta sección.`,
    });
  }

  autoTable(doc, {
    startY: y + 4,
    head: [["N°", "Código", "Apoderado", "Estudiante", "Cuotas", "Multas", "Total (S/)"]],
    body: deudores.filter((d) => d.total > 0).length
      ? deudores
          .filter((d) => d.total > 0)
          .map((d, i) => [
            i + 1, pdfText(d.codigo), pdfText(d.nombre), pdfText(d.hijo),
            d.cuotas > 0 ? N(d.cuotas) : "—",
            d.multas > 0 ? N(d.multas) : "—",
            N(d.total),
          ])
      : [["", "", "Todas las familias están al día", "", "", "", ""]],
    foot: [[
      "", "", `TOTAL POR COBRAR (${data.deuda?.padres ?? 0} familias)`, "",
      N(data.deuda?.total_cuotas), N(data.deuda?.total_multas), N(data.deuda?.total),
    ]],
    headStyles: { fillColor: ROJO, textColor: 255, fontStyle: "bold", fontSize: 8.5 },
    footStyles: { fillColor: [254, 226, 226], textColor: [127, 29, 29], fontStyle: "bold", fontSize: 8.5 },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" }, 1: { cellWidth: 22 },
      4: { halign: "right", cellWidth: 22 },
      5: { halign: "right", cellWidth: 22 },
      6: { halign: "right", cellWidth: 26, fontStyle: "bold" },
    },
    showFoot: "lastPage",
    alternateRowStyles: { fillColor: [250, 250, 249] },
    margin: { left: M, right: M },
  });

  // Multas explicadas
  const mu = data.multas ?? {};
  y = sitio(doc.lastAutoTable.finalY + 12, 60);

  y = titulo(doc, {
    x: M, y, numero: 7, ancho: ANCHO,
    texto: "Las multas",
    bajada: "Se generan cuando un apoderado no asiste a una faena o guardia que le correspondía.",
  });

  autoTable(doc, {
    startY: y + 4,
    head: [["Situación de las multas", "Cantidad", "Monto (S/)"]],
    body: [
      ["Cobradas en este periodo (ya están contadas en lo que entró)", "", N(mu.cobrado_en_periodo)],
      ["Pagadas en total desde que se empezó", mu.pagadas?.cantidad ?? 0, N(mu.pagadas?.monto)],
      ["Todavía sin pagar", mu.pendientes?.cantidad ?? 0, N(mu.pendientes?.monto)],
      ["Perdonadas por acuerdo (exoneradas)", mu.exoneradas?.cantidad ?? 0, N(mu.exoneradas?.monto)],
      ["Anuladas por error de registro", mu.anuladas?.cantidad ?? 0, N(mu.anuladas?.monto)],
    ],
    headStyles: { fillColor: GRIS, textColor: 255, fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 8.5 },
    columnStyles: {
      0: { cellWidth: "auto" },
      1: { cellWidth: 22, halign: "center" },
      2: { cellWidth: 28, halign: "right", fontStyle: "bold" },
    },
    showFoot: "lastPage",
    alternateRowStyles: { fillColor: [250, 250, 249] },
    margin: { left: M, right: M },
  });

  // ═══ Cómo se revisa esto + firmas ═════════════════════════════════════════
  y = sitio(doc.lastAutoTable.finalY + 12, 80);
  y = titulo(doc, {
    x: M, y, numero: 8, ancho: ANCHO,
    texto: "Cómo leer este balance",
    bajada: "Tres cosas que conviene tener claras antes de preguntar.",
  });

  const claves = [
    ["\"Queda en caja\" no es lo mismo que \"nos sobró\"",
      `Los ${S(r.saldo_final)} que quedan incluyen dinero ya comprometido para actividades que aún no se realizan.`],
    ["Lo que falta cobrar no está en la caja",
      `Los ${S(data.deuda?.total)} pendientes son una promesa de pago, no dinero disponible. `
      + `Solo cuentan las actividades ya realizadas: las cuotas de los meses que vienen `
      + `(${S(data.deuda?.total_por_vencer)}) no son deuda de nadie todavía.`],
    ["Los comprobantes se pueden pedir",
      `De los ${nEgresos} gastos del periodo, ${conComprobante} ya tienen su comprobante cargado en el sistema. `
      + `Los ${data.advertencias?.egresos_sin_comprobante ?? 0} restantes (${S(data.advertencias?.monto_sin_comprobante)}) `
      + `están registrados con fecha, concepto y monto, y la tesorería se compromete a adjuntar su respaldo.`],
  ];

  claves.forEach(([enunciado, explicacion]) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...TINTA);
    const tituloLineas = doc.splitTextToSize(`• ${enunciado}`, ANCHO);
    doc.text(tituloLineas, M, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...GRIS);
    const cuerpo = doc.splitTextToSize(explicacion, ANCHO - 4);
    doc.text(cuerpo, M + 4, y + 8 + tituloLineas.length * 4 + 0.5);
    y = y + 8 + tituloLineas.length * 4 + cuerpo.length * 4 + 2;
  });

  doc.setTextColor(...TINTA);

  // Cuadre de caja, para quien quiera comprobar la suma.
  // Se reserva sitio para la tabla y el bloque de firmas juntos: separar la
  // cuenta de las firmas deja una hoja suelta con tres líneas y nada más.
  y = sitio(y + 12, 100);
  y = titulo(doc, { x: M, y, numero: 9, ancho: ANCHO, texto: "La cuenta, paso a paso" });

  autoTable(doc, {
    startY: y + 4,
    body: [
      [`Teníamos al ${fechaLarga(data.periodo.desde)}`, N(r.saldo_inicial)],
      ["Más: todo lo que entró", N(r.ingresos)],
      ["Menos: todo lo que se gastó", N(r.egresos)],
    ],
    foot: [["QUEDA EN CAJA HOY", N(r.saldo_final)]],
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 3 },
    footStyles: { fillColor: AMBAR, textColor: 255, fontStyle: "bold", fontSize: 11 },
    columnStyles: { 0: { cellWidth: ANCHO - 40 }, 1: { cellWidth: 40, halign: "right", fontStyle: "bold" } },
    margin: { left: M, right: M },
  });

  // Firmas
  let yf = doc.lastAutoTable.finalY + 34;
  if (yf > H - 30) { doc.addPage(); yf = 60; }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const firmantes = [
    ["Tesorero(a)", firmas.tesorero],
    ["Presidente(a)", firmas.presidente],
    ["Fiscal", firmas.fiscal],
  ];
  const anchoFirma = (ANCHO - 20) / 3;
  firmantes.forEach(([cargo, nombre], i) => {
    const x = M + i * (anchoFirma + 10);
    doc.setDrawColor(...GRIS);
    doc.setLineWidth(0.2);
    doc.line(x, yf, x + anchoFirma, yf);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...TINTA);
    doc.text(pdfText(nombre, ""), x + anchoFirma / 2, yf + 5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRIS);
    doc.text(cargo, x + anchoFirma / 2, yf + 10, { align: "center" });
    doc.setTextColor(...TINTA);
  });

  // ═══ ANEXOS · el detalle contable ═════════════════════════════════════════
  doc.addPage();
  y = titulo(doc, {
    x: M, y: 20, numero: "A1", ancho: ANCHO,
    texto: "Anexo: mes a mes, con dos miradas",
    bajada:
      "La columna \"según caja\" es el dinero que efectivamente entró o salió ese mes: es la que da el saldo real. "
      + "La columna \"mes de la actividad\" toma ese mismo dinero y lo pone en el mes del evento que lo originó, "
      + "que es como uno lo tiene en la cabeza.",
  });

  autoTable(doc, {
    startY: y + 4,
    head: [
      [
        { content: "Mes", rowSpan: 2 },
        { content: "Según caja (cuándo se movió el dinero)", colSpan: 3, styles: { halign: "center" } },
        { content: "Según el mes de la actividad", colSpan: 3, styles: { halign: "center" } },
      ],
      ["Entró", "Salió", "Neto", "Entró", "Salió", "Neto"],
    ],
    body: meses.map((m) => [
      pdfText(m.label),
      N(m.ingresos), N(m.egresos), N(m.neto),
      N(m.ingresos_evento), N(m.egresos_evento), N(m.neto_evento),
    ]),
    foot: [[
      "TOTAL",
      N(r.ingresos), N(r.egresos), N(r.resultado),
      N(meses.reduce((s, m) => s + (m.ingresos_evento ?? 0), 0)),
      N(meses.reduce((s, m) => s + (m.egresos_evento ?? 0), 0)),
      N(meses.reduce((s, m) => s + (m.neto_evento ?? 0), 0)),
    ]],
    headStyles: { fillColor: AMBAR, textColor: 255, fontStyle: "bold", fontSize: 8 },
    footStyles: { fillColor: [254, 243, 199], textColor: [120, 53, 15], fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right", fontStyle: "bold" },
      4: { halign: "right", textColor: GRIS }, 5: { halign: "right", textColor: GRIS },
      6: { halign: "right", fontStyle: "bold", textColor: GRIS },
    },
    showFoot: "lastPage",
    alternateRowStyles: { fillColor: [250, 250, 249] },
    margin: { left: M, right: M },
  });

  doc.addPage();
  y = titulo(doc, {
    x: M, y: 20, numero: "A2", ancho: ANCHO,
    texto: "Anexo: todos los movimientos del periodo",
    bajada: "Cada entrada y cada salida de dinero, en orden de fecha. Es el respaldo de todas las cifras anteriores.",
  });

  autoTable(doc, {
    startY: y + 4,
    head: [["Fecha", "Descripción", "Origen", "Compr.", "Entró", "Salió"]],
    body: (data.movimientos ?? []).map((m) => [
      m.fecha,
      pdfText(m.descripcion),
      pdfText(m.categoria_label),
      comprobanteCorto(m.comprobante),
      m.tipo === 0 ? N(m.monto) : "",
      m.tipo === 1 ? N(m.monto) : "",
    ]),
    foot: [["", "", "", "TOTALES", N(r.ingresos), N(r.egresos)]],
    headStyles: { fillColor: [68, 64, 60], textColor: 255, fontStyle: "bold", fontSize: 8 },
    footStyles: { fillColor: [245, 245, 244], textColor: TINTA, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5 },
    columnStyles: {
      0: { cellWidth: 20 }, 1: { cellWidth: "auto" }, 2: { cellWidth: 30 },
      3: { cellWidth: 16 },
      4: { halign: "right", cellWidth: 22, textColor: VERDE },
      5: { halign: "right", cellWidth: 22, textColor: ROJO },
    },
    showFoot: "lastPage",
    alternateRowStyles: { fillColor: [250, 250, 249] },
    margin: { left: M, right: M },
  });

  // ── Pie de página en todas las hojas ────────────────────────────────────────
  const total = doc.internal.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRIS);
    doc.text(`${institucion} · Balance ${pdfText(data.periodo.label, "")}`, M, H - 8);
    doc.text(`Página ${p} de ${total}`, W - M, H - 8, { align: "right" });
    doc.setTextColor(...TINTA);
  }

  return doc;
}

/** Genera el PDF y dispara la descarga en el navegador. */
export function descargarBalancePDF(data, firmas, emitido) {
  const doc = construirBalancePDF(data, firmas, emitido);
  doc.save(`balance_${data.periodo.desde}_${data.periodo.hasta}.pdf`);
}
