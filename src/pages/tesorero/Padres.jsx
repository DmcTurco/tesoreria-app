import { useEffect, useRef, useState } from "react";
import {
  Search,
  Plus,
  ChevronRight,
  X,
  Loader2,
  KeyRound,
  Trash2,
} from "lucide-react";
import { usePadres } from "../../hook/usePadres";

export default function Padres() {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // "nuevo" | padre_obj
  const [toast, setToast] = useState(null);

  const {
    loading,
    error,
    padres,
    getPadres,
    createPadre,
    resetPassword,
    getQR,
    deletePadre,
  } = usePadres();

  useEffect(() => {
    getPadres();
  }, []);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };
  console.log(padres);
  const filtrados = padres.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo?.toLowerCase().includes(search.toLowerCase()) ||
      p.hijo?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-5">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-stone-800">Padres</h1>
          <p className="text-sm text-stone-400">{padres.length} registrados</p>
        </div>
        <button
          onClick={() => setModal("nuevo")}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={16} /> Nuevo padre
        </button>
      </div>

      {/* Buscador */}
      <div className="relative">
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

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-stone-100 divide-y divide-stone-50">
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
              className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 cursor-pointer transition-colors"
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
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-stone-700 truncate">
                  {p.nombre}
                </p>
                <p className="text-xs text-stone-400 truncate">
                  {p.codigo} · {p.hijo} · {p.grado}
                </p>
              </div>
              <ChevronRight size={16} className="text-stone-300 shrink-0" />
            </div>
          ))}
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
          onClose={() => setModal(null)}
          onUpdated={() => {
            showToast("Actualizado");
            getPadres();
          }}
          onDeleted={() => {
            setModal(null);
            showToast("Eliminado");
            getPadres();
          }}
          onError={(msg) => showToast(msg, "err")}
        />
      )}
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
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.nombre || !form.hijo || !form.grado || !form.password) {
      onError("Completa todos los campos obligatorios");
      return;
    }
    setLoading(true);
    try {
      await createPadre(form);
      onSaved();
    } catch (e) {
      onError(e.message ?? "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal titulo="Registrar padre / madre" onClose={onClose}>
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
      <p className="text-xs text-stone-400 -mt-2">
        El usuario será el código generado automáticamente (ej: PAD-0001)
      </p>
      <BtnPrimary onClick={handleSave} loading={loading}>
        Registrar
      </BtnPrimary>
    </Modal>
  );
}

// ── Modal detalle padre ───────────────────────────────────────────────────────
function ModalDetallePadre({
  padre,
  resetPassword,
  getQR,
  deletePadre,
  onClose,
  onUpdated,
  onDeleted,
  onError,
}) {
  const [tab, setTab] = useState("info");
  const [newPass, setNewPass] = useState("");
  const [loading, setLoading] = useState(false);
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
      </div>

      {/* Sub-tabs */}
      <div className="flex bg-stone-100 rounded-xl p-1 gap-1 mb-4">
        {[
          ["info", "Datos"],
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
          <button
            onClick={handleDelete}
            className="mt-3 flex items-center gap-2 text-red-400 hover:text-red-500 text-xs font-semibold transition-colors"
          >
            <Trash2 size={13} /> Eliminar padre
          </button>
        </div>
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

// ── Atoms ─────────────────────────────────────────────────────────────────────
function Modal({ titulo, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 sticky top-0 bg-white z-10">
          <p className="font-black text-stone-800 text-sm truncate pr-4">
            {titulo}
          </p>
          <button onClick={onClose}>
            <X size={18} className="text-stone-400 hover:text-stone-600" />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-3">{children}</div>
      </div>
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
        onChange={onChange}
        placeholder={placeholder}
        className="h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400 transition-colors"
      />
    </div>
  );
}

function BtnPrimary({ children, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 mt-1"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : children}
    </button>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-stone-50">
      <span className="text-stone-400 text-xs">{label}</span>
      <span className="text-stone-700 text-xs font-semibold">{value}</span>
    </div>
  );
}

function Toast({ msg, type }) {
  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg
      ${type === "err" ? "bg-red-500 text-white" : "bg-stone-800 text-white"}`}
    >
      {msg}
    </div>
  );
}

function LoadingRows() {
  return Array(4)
    .fill(0)
    .map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-3">
        <div className="w-10 h-10 rounded-full bg-stone-100 animate-pulse" />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="h-3 bg-stone-100 rounded-full w-2/3 animate-pulse" />
          <div className="h-2.5 bg-stone-100 rounded-full w-1/2 animate-pulse" />
        </div>
      </div>
    ));
}
