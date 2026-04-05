import { useState } from "react";
import {
  Database, RefreshCw, AlertTriangle, CheckCircle,
  Loader2, Terminal, ChevronDown, ChevronUp, Trash2,
} from "lucide-react";
import useApi from "../../hook/useApi";

export default function AdminDB() {
  const api = useApi();

  const [modalFresh, setModalFresh] = useState(false);
  const [confirm,    setConfirm]    = useState("");

  return (
    <div className="flex flex-col gap-4 h-[calc(100dvh-11.5rem)] lg:h-auto overflow-hidden w-full">
      {/* Header */}
      <div className="shrink-0">
        <h1 className="text-xl font-black text-stone-800">Administración DB</h1>
        <p className="text-sm text-stone-400 mt-0.5">Gestión de base de datos del servidor</p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4">

        {/* Aviso general */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 font-medium">
            Estas acciones afectan directamente la base de datos del servidor.
            Úsalas solo si sabes lo que estás haciendo.
          </p>
        </div>

        {/* ── Migrar (seguro) ── */}
        <AccionCard
          icon={<Database size={20} className="text-teal-600" />}
          iconBg="bg-teal-100"
          titulo="Ejecutar migraciones"
          descripcion="Aplica solo las migraciones nuevas que aún no se han ejecutado. No borra ningún dato existente."
          etiqueta="Seguro"
          etiquetaColor="bg-teal-50 text-teal-600"
          botonLabel="Ejecutar migrate"
          botonColor="bg-teal-500 hover:bg-teal-600"
          endpoint="/admin/migrate"
          api={api}
          confirmar={false}
        />

        {/* ── Migrate Fresh (destructivo) ── */}
        <AccionCard
          icon={<Trash2 size={20} className="text-red-500" />}
          iconBg="bg-red-100"
          titulo="Migrate fresh + seeders"
          descripcion="BORRA todas las tablas y las vuelve a crear desde cero, luego ejecuta los seeders. Perderás TODOS los datos."
          etiqueta="Destructivo"
          etiquetaColor="bg-red-50 text-red-500"
          botonLabel="Ejecutar migrate:fresh --seed"
          botonColor="bg-red-500 hover:bg-red-600"
          endpoint="/admin/migrate-fresh"
          api={api}
          confirmar={true}
          textoConfirm="BORRAR TODO"
        />

      </div>
    </div>
  );
}

// ── Tarjeta de acción ─────────────────────────────────────────────────────────
function AccionCard({
  icon, iconBg, titulo, descripcion,
  etiqueta, etiquetaColor,
  botonLabel, botonColor,
  endpoint, api,
  confirmar, textoConfirm,
}) {
  const [running,   setRunning]   = useState(false);
  const [resultado, setResultado] = useState(null); // { success, message, output }
  const [mostrarLog, setMostrarLog] = useState(false);
  const [inputConfirm, setInputConfirm] = useState("");
  const [error, setError] = useState(null);

  const puedeEjecutar = !confirmar || inputConfirm === textoConfirm;

  const handleEjecutar = async () => {
    if (!puedeEjecutar) return;
    setRunning(true);
    setResultado(null);
    setError(null);
    try {
      const res = await api.post(endpoint);
      setResultado(res);
      setMostrarLog(true);
      setInputConfirm("");
    } catch (e) {
      setError(e.message ?? "Error al ejecutar");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      {/* Header card */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-stone-50">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-black text-stone-800">{titulo}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${etiquetaColor}`}>
              {etiqueta}
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">{descripcion}</p>
        </div>
      </div>

      <div className="px-5 py-4 flex flex-col gap-3">
        {/* Campo de confirmación si es destructivo */}
        {confirmar && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-500">
              Escribe <span className="text-red-500 font-black">{textoConfirm}</span> para confirmar
            </label>
            <input
              type="text"
              value={inputConfirm}
              onChange={(e) => setInputConfirm(e.target.value)}
              placeholder={textoConfirm}
              className="h-10 px-3 rounded-xl border border-red-200 text-sm text-stone-700
                outline-none focus:border-red-400 transition-colors placeholder:text-stone-300"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2.5">
            <AlertTriangle size={14} className="text-red-400 shrink-0" />
            <p className="text-xs text-red-500 font-medium">{error}</p>
          </div>
        )}

        {/* Resultado */}
        {resultado && (
          <div className={`rounded-xl px-3 py-2.5 flex items-center gap-2
            ${resultado.success ? "bg-emerald-50" : "bg-red-50"}`}>
            {resultado.success
              ? <CheckCircle size={14} className="text-emerald-500 shrink-0" />
              : <AlertTriangle size={14} className="text-red-400 shrink-0" />}
            <p className={`text-xs font-semibold flex-1 ${resultado.success ? "text-emerald-700" : "text-red-600"}`}>
              {resultado.message}
            </p>
          </div>
        )}

        {/* Log output colapsable */}
        {resultado?.output && (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setMostrarLog((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-600 transition-colors self-start"
            >
              <Terminal size={12} />
              {mostrarLog ? "Ocultar" : "Ver"} output
              {mostrarLog ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {mostrarLog && (
              <pre className="bg-stone-900 text-emerald-400 text-[11px] rounded-xl px-4 py-3
                overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
                {resultado.output}
              </pre>
            )}
          </div>
        )}

        {/* Botón */}
        <button
          onClick={handleEjecutar}
          disabled={running || !puedeEjecutar}
          className={`flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-bold
            text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${botonColor}`}
        >
          {running
            ? <><Loader2 size={15} className="animate-spin" /> Ejecutando...</>
            : <><RefreshCw size={15} /> {botonLabel}</>}
        </button>
      </div>
    </div>
  );
}
