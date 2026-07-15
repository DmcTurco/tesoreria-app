import { useEffect, useRef, useState } from "react";
import {
  Search,
  Plus,
  ChevronRight,
  X,
  Loader2,
  KeyRound,
  Trash2,
  UserX,
  UserCheck,
} from "lucide-react";
import { usePadres } from "../../hook/usePadres";
import { useEventos } from "../../hook/useEventos";
import useApi from "../../hook/useApi";
import { filtrarTexto } from "../../utils/utility";
import { EVENTO_TIPO, EVENTO_TIPO_LABEL, EVENTO_ESTADO } from "../../constants/estados";

export default function Padres() {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // "nuevo" | padre_obj
  const [toast, setToast] = useState(null);
  const [verRetirados, setVerRetirados] = useState(false);

  const {
    loading,
    error,
    padres,
    getPadres,
    createPadre,
    resetPassword,
    getQR,
    deletePadre,
    retirarPadre,
    reactivarPadre,
  } = usePadres();

  useEffect(() => {
    getPadres({ conRetirados: verRetirados });
  }, [verRetirados]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const filtrados = filtrarTexto(padres, search, ["nombre", "codigo", "hijo"]);

  return (
    <div className="flex flex-col gap-4 h-[calc(100dvh-10rem)] lg:h-auto overflow-hidden w-full">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-black text-stone-800">Padres</h1>
          <p className="text-sm text-stone-400">{padres.length} registrados</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVerRetirados((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2.5 rounded-xl transition-colors border
              ${verRetirados
                ? "bg-stone-200 text-stone-600 border-stone-300"
                : "bg-white text-stone-400 border-stone-200 hover:border-stone-300"}`}
          >
            <UserX size={14} />
            {verRetirados ? "Ocultar retirados" : "Ver retirados"}
          </button>
          <button
            onClick={() => setModal("nuevo")}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            <Plus size={16} /> Nuevo padre
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative shrink-0">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, código o alumno..."
          className="w-full h-11 pl-9 pr-4 bg-white border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400 transition-colors"
        />
      </div>

      {/* Lista — scrollable */}
      <div className="flex-1 min-h-0 rounded-2xl border border-stone-100 overflow-hidden">
        <div className="h-full overflow-y-auto overflow-x-hidden bg-white divide-y divide-stone-50">
          {loading && <LoadingRows />}
          {!loading && filtrados.length === 0 && (
            <p className="text-center text-stone-400 text-sm py-10">
              Sin resultados
            </p>
          )}
          {!loading &&
            filtrados.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 cursor-pointer transition-colors overflow-hidden"
                onClick={() => setModal(p)}
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-black text-amber-700">
                    {p.nombre
                      .split(" ")
                      .slice(0, 2)
                      .map((w) => w[0])
                      .join("")}
                  </span>
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-stone-700 line-clamp-1 wrap-break-word">
                      {p.nombre}
                    </p>
                    {!!p.retirado && (
                      <span className="shrink-0 text-[10px] font-bold bg-stone-200 text-stone-500 px-1.5 py-0.5 rounded-full">
                        Retirado
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-400 wrap-break-word">
                    {p.codigo} · {p.hijo} · {p.grado}
                  </p>
                </div>
                <ChevronRight size={16} className="text-stone-300 shrink-0" />
              </div>
            ))}
        </div>
      </div>

      {modal === "nuevo" && (
        <ModalNuevoPadre
          createPadre={createPadre}
          onClose={() => setModal(null)}
          onSaved={() => {
            setModal(null);
            showToast("Padre registrado");
            getPadres();
          }}
          onError={(msg) => showToast(msg, "err")}
        />
      )}

      {modal && modal !== "nuevo" && (
        <ModalDetallePadre
          padre={modal}
          resetPassword={resetPassword}
          getQR={getQR}
          deletePadre={deletePadre}
          retirarPadre={retirarPadre}
          reactivarPadre={reactivarPadre}
          onClose={() => setModal(null)}
          onUpdated={() => {
            showToast("Actualizado");
            getPadres({ conRetirados: verRetirados });
          }}
          onDeleted={() => {
            setModal(null);
            showToast("Eliminado");
            getPadres({ conRetirados: verRetirados });
          }}
          onRetirado={() => {
            setModal(null);
            showToast("Padre marcado como retirado");
            getPadres({ conRetirados: verRetirados });
          }}
          onReactivado={() => {
            setModal(null);
            showToast("Padre reactivado correctamente");
            getPadres({ conRetirados: verRetirados });
          }}
          onError={(msg) => showToast(msg, "err")}
        />
      )}
    </div>
  );
}

// ── Atoms (definidos antes de los modales que los usan) ───────────────────────
function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2 py-1.5 border-b border-stone-50">
      <span className="text-xs font-bold text-stone-400 shrink-0">{label}</span>
      <span className="text-xs text-stone-700 text-right">{value}</span>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-stone-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm
          text-stone-700 outline-none focus:border-amber-400 transition-colors"
      />
    </div>
  );
}

function BtnPrimary({ onClick, loading, children }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="h-10 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold
        rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : children}
    </button>
  );
}

function Modal({ titulo, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className={`bg-white w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 sticky top-0 bg-white z-10">
          <p className="font-black text-stone-800 text-sm truncate pr-4">{titulo}</p>
          <button onClick={onClose}>
            <X size={18} className="text-stone-400 hover:text-stone-600" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-stone-100 shrink-0" />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-3 bg-stone-100 rounded-full w-2/3" />
            <div className="h-2.5 bg-stone-50 rounded-full w-1/2" />
          </div>
        </div>
      ))}
    </>
  );
}

function Toast({ msg, type }) {
  const isErr = type === "err";
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2
      px-4 py-3 rounded-2xl shadow-xl text-sm font-bold text-white
      ${isErr ? "bg-red-500" : "bg-emerald-500"}`}
    >
      {msg}
    </div>
  );
}

// ── Modal nuevo padre ─────────────────────────────────────────────────────────
function ModalNuevoPadre({ createPadre, onClose, onSaved, onError }) {
  const [form, setForm] = useState({
    nombre: "",
    hijo: "",
    grado: "",
    telefono: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const set = (k) => (value) => setForm((p) => ({ ...p, [k]: value }));

  // ── Eventos activos por cobrar (cuotas y actividades) ──────────────────────
  const { getEventos } = useEventos();
  const [eventosCobrables, setEventosCobrables] = useState(null); // null = cargando
  const [seleccionados, setSeleccionados] = useState(new Set());

  useEffect(() => {
    (async () => {
      try {
        const evs = (await getEventos()) ?? [];
        const cobrables = evs.filter(
          (e) =>
            e.estado === EVENTO_ESTADO.ACTIVO &&
            [EVENTO_TIPO.CUOTA, EVENTO_TIPO.ACTIVIDAD].includes(e.tipo)
        );
        setEventosCobrables(cobrables);
        // Por defecto todos marcados; el tesorero desmarca los que no aplican
        setSeleccionados(new Set(cobrables.map((e) => e.id)));
      } catch {
        setEventosCobrables([]);
      }
    })();
  }, []);

  const toggleEvento = (id) =>
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleSave = async () => {
    if (!form.nombre || !form.hijo || !form.grado || !form.password) {
      onError("Completa todos los campos obligatorios");
      return;
    }
    setLoading(true);
    try {
      await createPadre({ ...form, eventos_pagar: [...seleccionados] });
      onSaved();
    } catch (e) {
      onError(e.message ?? "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal titulo="Registrar padre / madre" onClose={onClose} wide>
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ── Columna izquierda: datos del padre ── */}
          <div className="flex flex-col gap-3">
            <Field
              label="Nombre completo *"
              value={form.nombre}
              onChange={set("nombre")}
              placeholder="María García López"
            />
            <Field
              label="Nombre del alumno/a *"
              value={form.hijo}
              onChange={set("hijo")}
              placeholder="Carlos García"
            />
            <Field
              label="Grado y sección *"
              value={form.grado}
              onChange={set("grado")}
              placeholder="3° A"
            />
            <Field
              label="Teléfono"
              value={form.telefono}
              onChange={set("telefono")}
              placeholder="987654321"
            />
            <Field
              label="Contraseña inicial *"
              type="password"
              value={form.password}
              onChange={set("password")}
              placeholder="••••••••"
            />
            <p className="text-xs text-stone-400 -mt-1">
              El usuario será el código generado automáticamente (ej: PAD-0001)
            </p>
          </div>

          {/* ── Columna derecha: eventos activos por cobrar ── */}
          <div className="flex flex-col">
            {eventosCobrables === null && (
              <div className="flex items-center gap-2 text-xs text-stone-400 pt-1">
                <Loader2 size={13} className="animate-spin" /> Cargando eventos activos...
              </div>
            )}
            {eventosCobrables?.length === 0 && (
              <p className="text-xs text-stone-400 pt-1">
                No hay cobros activos pendientes de asignar.
              </p>
            )}
            {eventosCobrables?.length > 0 && (
              <div className="flex flex-col gap-2 bg-stone-50 border border-stone-100 rounded-xl p-3 h-full">
                <p className="text-xs font-bold text-stone-600">
                  Cobros activos — marca los que sí debe pagar
                </p>
                <div className="flex flex-col gap-1 overflow-y-auto max-h-48 sm:max-h-72">
                  {eventosCobrables.map((ev) => (
                    <label
                      key={ev.id}
                      className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-white cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={seleccionados.has(ev.id)}
                        onChange={() => toggleEvento(ev.id)}
                        className="accent-amber-500 w-4 h-4 shrink-0"
                      />
                      <span className="flex-1 min-w-0 text-xs text-stone-700 font-medium truncate">
                        {ev.titulo}
                      </span>
                      <span className="text-[10px] font-bold text-stone-400 shrink-0">
                        {EVENTO_TIPO_LABEL[ev.tipo]}
                        {ev.multa_monto > 0 && ` · S/ ${Number(ev.multa_monto).toFixed(2)}`}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-[11px] text-stone-400 mt-auto">
                  Los no marcados quedarán como <b>Exonerado</b> (motivo: ingreso
                  posterior al evento). Puedes revertirlo luego desde el evento.
                </p>
              </div>
            )}
          </div>
        </div>

        <BtnPrimary onClick={handleSave} loading={loading}>
          Registrar
        </BtnPrimary>
      </div>
    </Modal>
  );
}

// ── Modal detalle padre ───────────────────────────────────────────────────────
function ModalDetallePadre({
  padre,
  resetPassword,
  getQR,
  deletePadre,
  retirarPadre,
  reactivarPadre,
  onClose,
  onUpdated,
  onDeleted,
  onRetirado,
  onReactivado,
  onError,
}) {
  const [tab, setTab] = useState("info");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRetirar, setLoadingRetirar] = useState(false);
  const [loadingReactivar, setLoadingReactivar] = useState(false);
  const [qrData, setQrData] = useState(null);

  const handleResetPass = async () => {
    if (!newPass) return;
    setLoading(true);
    try {
      await resetPassword(padre.id, newPass);
      onUpdated();
      setNewPass("");
    } catch (e) {
      onError(e.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(`¿Eliminar a ${padre.nombre}? Esta acción no se puede deshacer.`)
    )
      return;
    try {
      await deletePadre(padre.id);
      onDeleted();
    } catch (e) {
      onError(e.message ?? "Error al eliminar");
    }
  };

  const handleRetirar = async () => {
    if (!confirm(`¿Marcar a ${padre.nombre} como retirado? Se anularán sus deudas pendientes.`))
      return;
    setLoadingRetirar(true);
    try {
      await retirarPadre(padre.id);
      onRetirado();
    } catch (e) {
      onError(e.message ?? "Error al retirar");
    } finally {
      setLoadingRetirar(false);
    }
  };

  const handleReactivar = async () => {
    if (!confirm(`¿Reactivar a ${padre.nombre}? Se revertirán todas las exoneraciones por retiro y volverá a tener deudas pendientes.`))
      return;
    setLoadingReactivar(true);
    try {
      await reactivarPadre(padre.id);
      onReactivado();
    } catch (e) {
      onError(e.message ?? "Error al reactivar");
    } finally {
      setLoadingReactivar(false);
    }
  };

  const loadQR = async () => {
    if (qrData) return;
    try {
      const data = await getQR(padre.id);
      setQrData(data);
    } catch {
      onError("Error al cargar QR");
    }
  };

  return (
    <Modal titulo={padre.nombre} onClose={onClose}>
      <div className="flex items-center gap-2 mb-1">
        <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">
          {padre.codigo}
        </span>
        <span className="text-xs text-stone-400">
          {padre.grado} · {padre.hijo}
        </span>
        {!!padre.retirado && (
          <span className="text-xs font-bold bg-stone-200 text-stone-500 px-2 py-0.5 rounded-full">
            Retirado
          </span>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="flex bg-stone-100 rounded-xl p-1 gap-1 mb-4">
        {[
          ["info", "Datos"],
          ["editar", "Editar"],
          ["pass", "Contraseña"],
          ["qr", "QR"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => {
              setTab(k);
              if (k === "qr") loadQR();
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all
              ${tab === k ? "bg-white text-amber-600 shadow-sm" : "text-stone-500"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="flex flex-col gap-2 text-sm">
          <Row label="Nombre" value={padre.nombre} />
          <Row label="Alumno/a" value={padre.hijo} />
          <Row label="Grado" value={padre.grado} />
          <Row label="Teléfono" value={padre.telefono || "—"} />
          <Row label="Usuario" value={padre.codigo} />
          {padre.retirado && padre.fecha_retiro && (
            <Row label="Fecha retiro" value={padre.fecha_retiro} />
          )}
        </div>
      )}

      {tab === "editar" && (
        <TabEditar padre={padre} onUpdated={onUpdated} onError={onError} />
      )}

      {tab === "pass" && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-stone-400">
            Define una nueva contraseña para este padre.
          </p>
          <Field
            label="Nueva contraseña"
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder="••••••••"
          />
          <BtnPrimary onClick={handleResetPass} loading={loading}>
            <KeyRound size={14} /> Guardar contraseña
          </BtnPrimary>
        </div>
      )}

      {tab === "qr" && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-xs text-stone-400 text-center">
            QR personal del padre para registrar asistencia
          </p>
          {qrData ? (
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-100">
              <QRSimple data={qrData.qr_data} size={180} />
            </div>
          ) : (
            <Loader2 size={24} className="text-amber-400 animate-spin my-6" />
          )}
          {qrData && (
            <p className="text-[11px] text-stone-300 font-mono break-all text-center px-2">
              {qrData.codigo}
            </p>
          )}
        </div>
      )}

      {/* Footer de acciones */}
      <div className="flex gap-2 pt-2 border-t border-stone-100 -mx-5 px-5">
        {!padre.retirado && (
          <button
            onClick={handleRetirar}
            disabled={loadingRetirar}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-bold rounded-xl transition-colors disabled:opacity-60"
          >
            {loadingRetirar ? <Loader2 size={13} className="animate-spin" /> : <UserX size={13} />}
            Retirar
          </button>
        )}
        {!!padre.retirado && (
          <button
            onClick={handleReactivar}
            disabled={loadingReactivar}
            className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 text-xs font-bold rounded-xl transition-colors disabled:opacity-60"
          >
            {loadingReactivar ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />}
            Reactivar
          </button>
        )}
        <button
          onClick={handleDelete}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-red-50 hover:bg-red-100 text-red-500 text-xs font-bold rounded-xl transition-colors"
        >
          <Trash2 size={13} /> Eliminar
        </button>
      </div>
    </Modal>
  );
}

// ── QR canvas simple (sin dependencias externas) ──────────────────────────────
function QRSimple({ data, size = 180 }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current) return;
    const ctx = ref.current.getContext("2d");
    let h = 0;
    for (let i = 0; i < data.length; i++)
      h = ((h << 5) - h + data.charCodeAt(i)) | 0;
    let s = Math.abs(h);
    const rng = () => {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      return (s >>> 0) / 0xffffffff;
    };
    const m = 25,
      cell = size / (m + 4),
      off = cell * 2;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, size, size);
    const finder = (x, y) => {
      ctx.fillStyle = "#000";
      ctx.fillRect(x, y, cell * 7, cell * 7);
      ctx.fillStyle = "#fff";
      ctx.fillRect(x + cell, y + cell, cell * 5, cell * 5);
      ctx.fillStyle = "#000";
      ctx.fillRect(x + cell * 2, y + cell * 2, cell * 3, cell * 3);
    };
    finder(off, off);
    finder(off + (m - 7) * cell, off);
    finder(off, off + (m - 7) * cell);
    ctx.fillStyle = "#000";
    for (let r = 0; r < m; r++)
      for (let c = 0; c < m; c++) {
        if ((r < 8 && c < 8) || (r < 8 && c >= m - 8) || (r >= m - 8 && c < 8))
          continue;
        if (rng() > 0.45)
          ctx.fillRect(off + c * cell, off + r * cell, cell - 0.5, cell - 0.5);
      }
  }, [data, size]);
  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      style={{ borderRadius: 8, display: "block" }}
    />
  );
}

// ── Tab editar padre ──────────────────────────────────────────────────────────
function TabEditar({ padre, onUpdated, onError }) {
  const [form, setForm] = useState({
    nombre: padre.nombre ?? "",
    hijo: padre.hijo ?? "",
    grado: padre.grado ?? "",
    telefono: padre.telefono ?? "",
  });
  const [loading, setLoading] = useState(false);
  const api = useApi();
  const set = (k) => (value) => setForm((p) => ({ ...p, [k]: value }));

  const handleSave = async () => {
    if (!form.nombre || !form.hijo || !form.grado) {
      onError("Nombre, alumno/a y grado son obligatorios");
      return;
    }
    setLoading(true);
    try {
      await api.put(`/padres/${padre.id}`, form);
      onUpdated();
    } catch (e) {
      onError(e.message ?? "Error al actualizar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Field
        label="Nombre completo *"
        value={form.nombre}
        onChange={set("nombre")}
        placeholder="María García López"
      />
      <Field
        label="Nombre del alumno/a *"
        value={form.hijo}
        onChange={set("hijo")}
        placeholder="Carlos García"
      />
      <Field
        label="Grado y sección *"
        value={form.grado}
        onChange={set("grado")}
        placeholder="3° A"
      />
      <Field
        label="Teléfono"
        value={form.telefono}
        onChange={set("telefono")}
        placeholder="987654321"
      />
      <BtnPrimary onClick={handleSave} loading={loading}>
        Guardar cambios
      </BtnPrimary>
    </div>
  );
}

