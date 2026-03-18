// components/PadreBuscador.jsx
import { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, AlertCircle } from "lucide-react";
import useApi from "@/hook/useApi"; // ajusta la ruta según tu proyecto

export default function PadreBuscador({ value, onChange }) {
  const [query, setQuery] = useState("");
  const [padres, setPadres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const api = useApi();

  useEffect(() => {
    const fetchPadres = async () => {
      try {
        const response = await api.get("/padres/con-deuda");
        setPadres(response ?? []);
      } catch (err) {
        console.error("Error cargando padres con deuda:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPadres();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = padres.filter((p) => {
    const q = query.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(q) ||
      p.hijo.toLowerCase().includes(q) ||
      (p.dni && p.dni.includes(q))
    );
  });

  const handleSelect = (padre) => {
    setSelected(padre);
    setQuery(padre.nombre);
    setOpen(false);
    onChange(padre.id, padre);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    setOpen(false);
    onChange(null, null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const deudaColor = (monto) => {
    if (monto >= 100) return "text-red-600 bg-red-50 border-red-200";
    if (monto >= 30) return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-amber-600 bg-amber-50 border-amber-200";
  };

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label className="text-xs font-bold text-stone-600">
        Padre / Madre{" "}
        {!loading && (
          <span className="font-normal text-stone-400">
            ({padres.length} con deuda pendiente)
          </span>
        )}
      </label>

      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder={
            loading ? "Cargando padres..." : "Buscar por nombre, hijo o DNI..."
          }
          disabled={loading}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (selected && e.target.value !== selected.nombre) {
              setSelected(null);
              onChange(null, null);
            }
          }}
          onFocus={() => setOpen(true)}
          className={`w-full h-10 pl-8 pr-8 bg-stone-50 border rounded-xl text-sm text-stone-700 outline-none transition-all
            ${selected ? "border-amber-400 bg-amber-50" : "border-stone-200 focus:border-amber-400"}
            ${loading ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 size={14} className="text-amber-400 animate-spin" />
          ) : selected ? (
            <button
              onClick={handleClear}
              className="text-stone-400 hover:text-stone-600"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </div>

      {selected && (
        <div
          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold ${deudaColor(selected.deuda_total)}`}
        >
          <div className="flex items-center gap-1.5">
            <AlertCircle size={12} />
            <span>
              Deuda total: <strong>S/ {selected.deuda_total.toFixed(2)}</strong>
            </span>
          </div>
          <div className="flex gap-2 text-[10px] font-normal opacity-75">
            {selected.desglose.multas > 0 && (
              <span>Multas S/ {selected.desglose.multas.toFixed(2)}</span>
            )}
            {selected.desglose.cuotas > 0 && (
              <span>Cuotas S/ {selected.desglose.cuotas.toFixed(2)}</span>
            )}
            {selected.desglose.cobros > 0 && (
              <span>Cobros S/ {selected.desglose.cobros.toFixed(2)}</span>
            )}
          </div>
        </div>
      )}

      {open && !loading && (
        <div className="relative z-50">
          <div className="absolute top-0 left-0 right-0 bg-white border border-stone-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-stone-400">
                {query
                  ? "No se encontró ningún padre con esa búsqueda"
                  : "No hay padres con deuda pendiente"}
              </div>
            ) : (
              filtered.map((padre) => (
                <button
                  key={padre.id}
                  onClick={() => handleSelect(padre)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-amber-50 transition-colors text-left border-b border-stone-50 last:border-b-0"
                >
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-stone-700 truncate">
                      {padre.nombre}
                    </span>
                    <span className="text-[11px] text-stone-400 truncate">
                      Hijo/a: {padre.hijo}
                      {padre.dni ? ` · DNI: ${padre.dni}` : ""}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 ml-3 px-2 py-0.5 rounded-full text-xs font-black border ${deudaColor(padre.deuda_total)}`}
                  >
                    S/ {padre.deuda_total.toFixed(2)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
