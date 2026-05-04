import { useEffect, useRef, useState } from "react";
import {
  Download, Upload, FileText, CheckCircle,
  AlertCircle, Loader2, X, Users,
} from "lucide-react";
import { usePadres } from "../../hook/usePadres";
import { getApiBaseUrl, getAuthToken } from "../../services/api";

// ── Helpers CSV ───────────────────────────────────────────────────────────────
function csvEscape(val) {
  if (val == null) return "";
  const s = String(val);
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

function generarCSV(filas, cabeceras) {
  const rows = [cabeceras, ...filas].map((r) => r.map(csvEscape).join(","));
  return rows.join("\r\n");
}

function descargarCSV(contenido, nombre) {
  const blob = new Blob(["\uFEFF" + contenido], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function parsearCSV(texto) {
  const lineas = texto.trim().split(/\r?\n/);
  return lineas.map((l) => {
    const cols = []; let cur = ""; let dentro = false;
    for (let i = 0; i < l.length; i++) {
      const c = l[i];
      if (c === '"') { dentro = !dentro; continue; }
      if (c === "," && !dentro) { cols.push(cur.trim()); cur = ""; continue; }
      cur += c;
    }
    cols.push(cur.trim());
    return cols;
  });
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ExportarImportar() {
  const { padres, getPadres, loading: loadingPadres } = usePadres();
  const [toast, setToast]       = useState(null);

  useEffect(() => { getPadres(); }, []);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Exportar padres actuales ────────────────────────────────────────────────
  const handleExportar = () => {
    if (padres.length === 0) { showToast("No hay padres para exportar", "err"); return; }
    const cabeceras = ["nombre", "hijo", "grado", "telefono", "codigo"];
    const filas = padres.map((p) => [p.nombre, p.hijo, p.grado, p.telefono ?? "", p.codigo]);
    descargarCSV(generarCSV(filas, cabeceras), "padres.csv");
    showToast(`${padres.length} padres exportados`);
  };

  // ── Descargar plantilla vacía ───────────────────────────────────────────────
  const handlePlantilla = () => {
    const contenido = generarCSV(
      [["Juan Pérez García", "Ana Pérez", "1° A", "987654321", "12345678", "PAD-0001"]],
      ["nombre", "hijo", "grado", "telefono", "password", "codigo"],
    );
    descargarCSV(contenido, "plantilla_padres.csv");
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100dvh-10rem)] lg:h-auto overflow-hidden w-full">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-xl font-black text-stone-800">Exportar / Importar</h1>
        <p className="text-sm text-stone-400 mt-0.5">Gestiona el listado de padres en masa</p>
      </div>

      {/* Contenido scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">

        {/* ── Card Exportar ── */}
        <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <Download size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-black text-stone-800">Exportar padres</p>
              <p className="text-xs text-stone-400">Descarga el listado actual como CSV</p>
            </div>
            {!loadingPadres && (
              <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 text-stone-500">
                {padres.length} padres
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleExportar}
              disabled={loadingPadres}
              className="flex-1 flex items-center justify-center gap-2 h-10 bg-amber-500 hover:bg-amber-600
                text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
            >
              {loadingPadres
                ? <Loader2 size={15} className="animate-spin" />
                : <><Download size={15} /> Exportar padres</>}
            </button>
            <button
              onClick={handlePlantilla}
              className="flex-1 flex items-center justify-center gap-2 h-10 bg-stone-100 hover:bg-stone-200
                text-stone-600 text-sm font-bold rounded-xl transition-colors"
            >
              <FileText size={15} /> Descargar plantilla
            </button>
          </div>

          {/* Descripción de columnas */}
          <div className="bg-stone-50 rounded-xl p-3">
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide mb-2">
              Columnas del CSV
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {[
                ["nombre", "Requerido"],
                ["hijo", "Requerido"],
                ["grado", "Requerido"],
                ["telefono", "Opcional"],
                ["password", "Opcional"],
                ["codigo", "Opcional"],
              ].map(([col, note]) => (
                <div key={col} className="bg-white rounded-lg px-2 py-1.5 text-center">
                  <p className="text-xs font-bold text-stone-700">{col}</p>
                  <p className="text-[9px] text-stone-400">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Card Importar ── */}
        <ImportarCard onToast={showToast} onRefresh={getPadres} />

      </div>
    </div>
  );
}

// ── Tarjeta de importación ────────────────────────────────────────────────────
function ImportarCard({ onToast, onRefresh }) {
  const fileRef            = useRef(null);
  const [archivo, setArchivo]       = useState(null);
  const [preview, setPreview]       = useState([]); // primeras 5 filas de datos
  const [passwordDefault, setPasswordDefault] = useState("12345678");
  const [importing, setImporting]   = useState(false);
  const [resultado, setResultado]   = useState(null); // { creados, errores }

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setArchivo(f);
    setResultado(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const filas = parsearCSV(ev.target.result);
      // Saltar cabecera
      setPreview(filas.slice(1, 6));
    };
    reader.readAsText(f, "UTF-8");
  };

  const handleQuitar = () => {
    setArchivo(null);
    setPreview([]);
    setResultado(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImportar = async () => {
    if (!archivo) return;
    setImporting(true);
    setResultado(null);
    try {
      const formData = new FormData();
      formData.append("archivo", archivo);
      formData.append("password_default", passwordDefault);

      const token = getAuthToken();
      const res   = await fetch(`${getApiBaseUrl()}/padres/importar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        body: formData,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? `Error ${res.status}`);

      setResultado(data);
      if (data.creados > 0) {
        onToast(`${data.creados} padre(s) importado(s) correctamente`);
        onRefresh();
      } else {
        onToast("No se importó ningún padre", "err");
      }
    } catch (e) {
      onToast(e.message ?? "Error al importar", "err");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
          <Upload size={18} className="text-teal-600" />
        </div>
        <div>
          <p className="text-sm font-black text-stone-800">Importar padres</p>
          <p className="text-xs text-stone-400">Carga masiva desde un archivo CSV</p>
        </div>
      </div>

      {/* Drop zone / file picker */}
      {!archivo ? (
        <label className="flex flex-col items-center gap-3 border-2 border-dashed border-stone-200
          rounded-xl p-8 cursor-pointer hover:border-teal-300 hover:bg-teal-50/30 transition-all">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center">
            <FileText size={22} className="text-stone-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-stone-600">Seleccionar archivo CSV</p>
            <p className="text-xs text-stone-400 mt-0.5">Formato: nombre, hijo, grado, telefono, password</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleFile}
          />
        </label>
      ) : (
        <div className="flex items-center gap-3 bg-teal-50 rounded-xl px-4 py-3">
          <FileText size={16} className="text-teal-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-teal-700 truncate">{archivo.name}</p>
            <p className="text-xs text-teal-500">
              {preview.length} fila(s) en vista previa
            </p>
          </div>
          <button onClick={handleQuitar} className="p-1 hover:bg-teal-100 rounded-lg transition-colors">
            <X size={15} className="text-teal-400" />
          </button>
        </div>
      )}

      {/* Vista previa */}
      {preview.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wide">
            Vista previa (primeras {preview.length} filas)
          </p>
          <div className="rounded-xl border border-stone-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-stone-50 text-stone-400 font-bold">
                    {["nombre", "hijo", "grado", "telefono", "password", "codigo"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {preview.map((row, i) => (
                    <tr key={i} className="text-stone-600">
                      {[0, 1, 2, 3, 4, 5].map((j) => (
                        <td key={j} className="px-3 py-2 max-w-32 truncate">
                          {row[j] ?? <span className="text-stone-300">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Contraseña por defecto */}
      {archivo && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-stone-500">
            Contraseña por defecto
            <span className="font-normal text-stone-400 ml-1">(si la columna está vacía)</span>
          </label>
          <input
            type="text"
            value={passwordDefault}
            onChange={(e) => setPasswordDefault(e.target.value)}
            className="h-10 px-3 rounded-xl border border-stone-200 text-sm text-stone-700
              outline-none focus:border-teal-400 transition-colors"
          />
        </div>
      )}

      {/* Resultado */}
      {resultado && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2.5">
            <Users size={14} className="text-emerald-500 shrink-0" />
            <p className="text-sm font-bold text-emerald-700">
              {resultado.creados} padre(s) importado(s)
            </p>
          </div>
          {resultado.errores?.length > 0 && (
            <div className="bg-red-50 rounded-xl px-3 py-2.5 flex flex-col gap-1">
              <p className="text-xs font-bold text-red-500">
                {resultado.errores.length} error(es):
              </p>
              {resultado.errores.map((e, i) => (
                <p key={i} className="text-xs text-red-400">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Botón importar */}
      <button
        onClick={handleImportar}
        disabled={!archivo || importing}
        className="flex items-center justify-center gap-2 h-11 bg-teal-500 hover:bg-teal-600
          text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-40"
      >
        {importing
          ? <Loader2 size={16} className="animate-spin" />
          : <><Upload size={15} /> Importar padres</>}
      </button>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  return (
    <div className={`fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-50
      flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg text-sm font-semibold
      ${type === "err" ? "bg-red-500 text-white" : "bg-stone-800 text-white"}`}>
      {type === "err"
        ? <AlertCircle size={15} className="shrink-0" />
        : <CheckCircle size={15} className="shrink-0" />}
      {msg}
    </div>
  );
}
