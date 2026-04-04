import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Check, Search, Users } from "lucide-react";
import { usePadres } from "@/hook/usePadres";
import { formatFecha } from "../../../utils/utility";
import useApi from "@/hook/useApi";

export default function VistaAsignarDia({ evento, fecha, yaAsignados, faltante, onBack, onDone, onError }) {
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [sel,    setSel]    = useState(new Set());
  const { padres, getPadres, loading } = usePadres();
  const api = useApi();

  useEffect(() => { getPadres(); }, []);

  const toggle = (id) => {
    if (yaAsignados.includes(id)) return;
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < faltante) {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (sel.size === 0)      { onError("Selecciona al menos un padre", "err"); return; }
    if (sel.size > faltante) { onError(`Solo faltan ${faltante} lugar(es)`, "err"); return; }
    setSaving(true);
    try {
      await Promise.all(
        [...sel].map((padreId) =>
          api.post(`/eventos/${evento.id}/agregar-padre`, { padre_id: padreId, fecha })
        )
      );
      onDone();
    } catch (e) {
      onError(e.message ?? "Error al asignar", "err");
    } finally {
      setSaving(false);
    }
  };

  const disponibles = padres.filter(
    (p) =>
      !yaAsignados.includes(p.id) &&
      (p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.hijo?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-4 h-[calc(100dvh-11.5rem)] lg:h-auto overflow-hidden w-full">

      {/* Header */}
      <div className="shrink-0 flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center transition-colors shrink-0"
        >
          <ArrowLeft size={16} className="text-stone-600" />
        </button>
        <div>
          <h1 className="text-lg font-black text-stone-800">Asignar padres</h1>
          <p className="text-xs text-stone-400">
            {formatFecha(fecha)} · {faltante} lugar(es) disponible(s)
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="shrink-0 relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar padre o alumno..."
          className="w-full h-10 pl-9 pr-4 bg-white border border-stone-200 rounded-xl text-sm
            text-stone-700 outline-none focus:border-amber-400 transition-colors"
        />
      </div>

      {/* Contador */}
      <div className="shrink-0 flex items-center justify-between -mt-2 px-1">
        <p className="text-[10px] text-stone-400">{sel.size}/{faltante} seleccionado(s)</p>
        {sel.size > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
            {sel.size} padre(s) listo(s)
          </span>
        )}
      </div>

      {/* Lista — scrollable */}
      <div className="flex-1 min-h-0 rounded-2xl border border-stone-100 overflow-hidden">
        <div className="h-full overflow-y-auto overflow-x-hidden bg-white divide-y divide-stone-50">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 size={20} className="text-amber-400 animate-spin" />
            </div>
          ) : disponibles.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <Users size={28} className="text-stone-200" />
              <p className="text-sm text-stone-300 font-medium">Sin padres disponibles</p>
            </div>
          ) : (
            disponibles.map((p) => {
              const checked = sel.has(p.id);
              const lleno = sel.size >= faltante && !checked;
              return (
                <div
                  key={p.id}
                  onClick={() => !lleno && toggle(p.id)}
                  className={`flex items-center gap-3 px-4 py-3 transition-colors
                    ${lleno ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                    ${checked ? "bg-amber-50" : !lleno ? "hover:bg-stone-50" : ""}`}
                >
                  {/* Checkbox */}
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                    ${checked ? "bg-amber-500 border-amber-500" : "border-stone-300"}`}>
                    {checked && <Check size={11} className="text-white" strokeWidth={3} />}
                  </div>

                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-amber-700">
                      {p.nombre.split(" ").slice(0, 2).map((w) => w[0]).join("")}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-semibold text-stone-700 line-clamp-2 wrap-break-word">{p.nombre}</p>
                    <p className="text-xs text-stone-400 wrap-break-word">{p.hijo} · {p.grado}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Botón guardar — siempre al fondo */}
      <button
        onClick={handleSave}
        disabled={saving || sel.size === 0}
        className="shrink-0 w-full h-11 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold
          rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        {saving
          ? <Loader2 size={16} className="animate-spin" />
          : `Asignar ${sel.size > 0 ? sel.size + " padre(s)" : ""}`}
      </button>

    </div>
  );
}
