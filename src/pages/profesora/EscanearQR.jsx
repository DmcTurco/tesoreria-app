import { useEffect, useRef, useState } from "react";
import {
  QrCode,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Camera,
  Search,
  User,
} from "lucide-react";
import { useEventos } from "../../hook/useEventos";
import { EVENTO_ESTADO, EVENTO_TIPO_LABEL } from "../../constants/estados";
import useApi from "../../hook/useApi";

export default function EscanearQR() {
  const [eventoId, setEventoId] = useState("");
  const [modo, setModo] = useState("qr"); // "qr" | "manual"
  const [resultado, setResultado] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [camError, setCamError] = useState(null);
  const [permiso, setPermiso] = useState(null); // null | "granted" | "denied"
  const html5Ref = useRef(null);

  const { eventos, getEventos } = useEventos();
  const api = useApi();
  const hoy = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    getEventos();
  }, []);

  const eventosHoy = eventos.filter((e) => {
    if (e.estado === EVENTO_ESTADO.CERRADO) return false;
    const fi = e.fecha_inicio?.slice(0, 10);
    const ff = e.fecha_fin?.slice(0, 10);
    if (fi > hoy) return false;
    if (ff && ff < hoy) return false;
    return true;
  });

  // Auto-seleccionar si solo hay un evento
  useEffect(() => {
    if (eventosHoy.length === 1 && !eventoId) {
      setEventoId(String(eventosHoy[0].id));
    }
  }, [eventosHoy]);

  // ── QR ────────────────────────────────────────────────────────────────────
  const pedirPermiso = async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      stream.getTracks().forEach((t) => t.stop());
      setPermiso("granted");
    } catch {
      setPermiso("denied");
    }
  };

  const startScanner = async () => {
    setScanning(true);
    setCamError(null);
    setResultado(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      html5Ref.current = new Html5Qrcode("qr-reader");
      await html5Ref.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (text) => {
          const parts = text.split("|");
          if (parts[0] !== "APAFA-TES" || !parts[1]) {
            setResultado({
              ok: false,
              mensaje: "QR inválido — no pertenece a este sistema",
            });
            return;
          }
          await registrar(parseInt(parts[1]), parts[3]);
        },
        () => {},
      );
    } catch (e) {
      const msg = e?.message ?? "";
      if (msg.includes("ermission") || msg.includes("NotAllowed")) {
        setPermiso("denied");
      } else {
        setCamError("No se pudo iniciar la cámara: " + msg);
      }
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    try {
      if (html5Ref.current) {
        await html5Ref.current.stop();
        html5Ref.current = null;
      }
    } catch {}
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // ── Registro común ────────────────────────────────────────────────────────
  const registrar = async (padreId, nombre) => {
    await stopScanner();
    try {
      await api.post(`/eventos/${eventoId}/asistencia`, {
        padre_id: padreId,
        fecha: hoy,
      });
      setResultado({
        ok: true,
        nombre,
        mensaje: "Asistencia registrada correctamente",
      });
    } catch (e) {
      setResultado({
        ok: false,
        nombre,
        mensaje: e.message ?? "Error al registrar",
      });
    }
  };

  const reiniciar = () => {
    setResultado(null);
    if (modo === "qr") startScanner();
  };

  const eventoSeleccionado = eventosHoy.find((e) => String(e.id) === eventoId);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-black text-stone-800">
          Registrar asistencia
        </h1>
        <p className="text-sm text-stone-400">Por QR o búsqueda manual</p>
      </div>

      {/* Sin eventos */}
      {eventosHoy.length === 0 && (
        <div className="bg-white rounded-2xl border border-stone-100 flex flex-col items-center py-10 gap-2">
          <QrCode size={32} className="text-stone-200" />
          <p className="text-stone-400 text-sm">Sin eventos activos hoy</p>
        </div>
      )}

      {/* Evento único — mostrar como badge */}
      {eventosHoy.length === 1 && eventoSeleccionado && (
        <div className="bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
            <QrCode size={15} className="text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wide">
              {EVENTO_TIPO_LABEL[eventoSeleccionado.tipo]}
            </p>
            <p className="text-sm font-black text-teal-800 truncate">
              {eventoSeleccionado.titulo}
            </p>
          </div>
        </div>
      )}

      {/* Selector si hay más de 1 */}
      {eventosHoy.length > 1 && (
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-stone-600">
            Selecciona el evento
          </label>
          <select
            value={eventoId}
            onChange={(e) => {
              setEventoId(e.target.value);
              setResultado(null);
              stopScanner();
            }}
            className="h-11 px-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-teal-400"
          >
            <option value="">— Elegir evento —</option>
            {eventosHoy.map((e) => (
              <option key={e.id} value={e.id}>
                {EVENTO_TIPO_LABEL[e.tipo]} · {e.titulo}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Toggle QR / Manual */}
      {eventoId && (
        <>
          <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => {
                setModo("qr");
                setResultado(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all
                ${modo === "qr" ? "bg-white text-teal-600 shadow-sm" : "text-stone-500"}`}
            >
              <QrCode size={14} /> Escanear QR
            </button>
            <button
              onClick={() => {
                setModo("manual");
                setResultado(null);
                stopScanner();
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all
                ${modo === "manual" ? "bg-white text-teal-600 shadow-sm" : "text-stone-500"}`}
            >
              <Search size={14} /> Búsqueda manual
            </button>
          </div>

          {/* ── Modo QR ── */}
          {modo === "qr" && (
            <>
              {/* Pedir permiso */}
              {permiso === null && (
                <div className="bg-white rounded-2xl border border-stone-100 px-5 py-8 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center">
                    <Camera size={30} className="text-teal-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-stone-700 mb-1">
                      Acceso a la cámara
                    </p>
                    <p className="text-xs text-stone-400">
                      Necesitamos permiso para escanear el QR
                    </p>
                  </div>
                  <button
                    onClick={pedirPermiso}
                    className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors"
                  >
                    Permitir cámara
                  </button>
                  <button
                    onClick={() => setModo("manual")}
                    className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    Prefiero buscar manualmente →
                  </button>
                </div>
              )}

              {/* Cámara activa */}
              {permiso === "granted" && (
                <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
                  <div
                    className="relative bg-stone-900"
                    style={{ minHeight: 300 }}
                  >
                    <div id="qr-reader" style={{ width: "100%" }} />
                    {!scanning && !resultado && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <QrCode size={44} className="text-stone-500" />
                        <button
                          onClick={startScanner}
                          className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-colors"
                        >
                          Iniciar escáner
                        </button>
                      </div>
                    )}
                    {scanning && !resultado && (
                      <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                        <div className="bg-black/60 text-white text-xs font-semibold px-4 py-2 rounded-full flex items-center gap-2">
                          <Loader2 size={13} className="animate-spin" />{" "}
                          Buscando QR...
                        </div>
                      </div>
                    )}
                  </div>
                  {camError && (
                    <div className="px-5 py-3 bg-red-50 border-t border-red-100">
                      <p className="text-xs text-red-500 font-medium">
                        {camError}
                      </p>
                    </div>
                  )}
                  <Resultado resultado={resultado} onReiniciar={reiniciar} />
                </div>
              )}

              {/* Permiso denegado */}
              {permiso === "denied" && (
                <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-4 flex flex-col gap-3">
                  <p className="text-sm font-bold text-red-600">
                    Permiso de cámara denegado
                  </p>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    <span className="font-bold">Android:</span> Configuración →
                    Aplicaciones → Chrome → Permisos → Cámara → Permitir
                  </p>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    <span className="font-bold">iPhone:</span> Configuración →
                    Safari → Cámara → Permitir
                  </p>
                  <p className="text-xs text-stone-400">
                    Después recarga la página.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setPermiso(null);
                        setCamError(null);
                      }}
                      className="flex-1 h-9 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Reintentar
                    </button>
                    <button
                      onClick={() => setModo("manual")}
                      className="flex-1 h-9 bg-white border border-stone-200 text-stone-600 text-xs font-bold rounded-xl hover:bg-stone-50 transition-colors"
                    >
                      Modo manual
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── Modo Manual ── */}
          {modo === "manual" && (
            <ModoManual
              eventoId={eventoId}
              fecha={hoy}
              onRegistrar={registrar}
              resultado={resultado}
              onReiniciar={() => setResultado(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

// ── Modo manual: buscar padre por nombre ──────────────────────────────────────
function ModoManual({ eventoId, fecha, onRegistrar, resultado, onReiniciar }) {
  const [padres, setPadres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [marcando, setMarcando] = useState(null);
  const api = useApi();

  useEffect(() => {
    api
      .get(`/eventos/${eventoId}/padres`)
      .then((r) => setPadres(Array.isArray(r) ? r : []))
      .catch(() => setPadres([]))
      .finally(() => setLoading(false));
  }, [eventoId]);
  console.log(padres);
  const filtrados = padres.filter((ep) => {
    if (ep.estado === 1) return false; // ya presente
    const nombre = ep.padre?.nombre?.toLowerCase() ?? "";
    return nombre.includes(search.toLowerCase());
  });

  const handleMarcar = async (ep) => {
    setMarcando(ep.padre_id);
    await onRegistrar(ep.padre_id, ep.padre?.nombre);
    setMarcando(null);
  };

  if (resultado) {
    return <Resultado resultado={resultado} onReiniciar={onReiniciar} />;
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-stone-50">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar padre por nombre..."
            className="w-full h-10 pl-9 pr-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-teal-400 transition-colors"
          />
        </div>
      </div>

      <div className="divide-y divide-stone-50 max-h-72 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={22} className="text-teal-400 animate-spin" />
          </div>
        ) : filtrados.length === 0 ? (
          <p className="text-center text-stone-400 text-sm py-8">
            {search
              ? "Sin resultados"
              : "Todos los padres ya marcaron asistencia"}
          </p>
        ) : (
          filtrados.map((ep) => (
            <div key={ep.id} className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-teal-700">
                  {ep.padre?.nombre
                    ?.split(" ")
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join("") ?? "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-stone-700 truncate">
                  {ep.padre?.nombre ?? "—"}
                </p>
                <p className="text-xs text-stone-400">
                  {ep.padre?.grado} · {ep.padre?.hijo}
                </p>
              </div>
              <button
                onClick={() => handleMarcar(ep)}
                disabled={marcando === ep.padre_id}
                className="w-8 h-8 rounded-full bg-teal-50 hover:bg-teal-100 flex items-center justify-center transition-colors disabled:opacity-50"
                title="Marcar presente"
              >
                {marcando === ep.padre_id ? (
                  <Loader2 size={14} className="text-teal-500 animate-spin" />
                ) : (
                  <CheckCircle size={16} className="text-teal-500" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Resultado compartido ──────────────────────────────────────────────────────
function Resultado({ resultado, onReiniciar }) {
  if (!resultado) return null;
  return (
    <div
      className={`px-5 py-6 flex flex-col items-center gap-3 ${resultado.ok ? "bg-emerald-50" : "bg-red-50"}`}
    >
      {resultado.ok ? (
        <CheckCircle size={44} className="text-emerald-500" />
      ) : (
        <XCircle size={44} className="text-red-400" />
      )}
      {resultado.nombre && (
        <p className="text-base font-black text-stone-800">
          {resultado.nombre}
        </p>
      )}
      <p
        className={`text-sm font-semibold text-center ${resultado.ok ? "text-emerald-700" : "text-red-500"}`}
      >
        {resultado.mensaje}
      </p>
      <button
        onClick={onReiniciar}
        className="flex items-center gap-2 bg-white border border-stone-200 text-stone-700 text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-stone-50 transition-colors"
      >
        <RefreshCw size={14} /> {resultado.ok ? "Registrar otro" : "Reintentar"}
      </button>
    </div>
  );
}
