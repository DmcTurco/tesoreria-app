import { useEffect, useState } from "react";
import { Loader2, ArrowDownCircle, ArrowUpCircle, CheckCircle } from "lucide-react";
import useApi from "@/hook/useApi";

export default function TabAjustesEvento({ evento, resumen, onToast, onResuelto }) {
  const api = useApi();
  const [ajustes, setAjustes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resolviendo, setResolviendo] = useState(null); // padre_id en proceso

  const cargarAjustes = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/eventos/${evento.id}/ajustes`);
      setAjustes(Array.isArray(res) ? res : []);
    } catch (e) {
      onToast("Error al cargar ajustes", "err");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAjustes();
  }, []);

  const handleResolver = async (ajuste) => {
    setResolviendo(ajuste.padre_id);
    try {
      const body = { padre_id: ajuste.padre_id };

      // Si debe más → enviar monto adicional
      if (ajuste.diferencia > 0) {
        body.monto_adicional = ajuste.diferencia;
      }
      // Si se le devuelve → solo marcar resuelto, sin monto adicional

      await api.post(`/eventos/${evento.id}/resolver-ajuste`, body);
      onToast(
        ajuste.diferencia > 0
          ? `Cobro adicional registrado a ${ajuste.nombre}`
          : `Devolución registrada a ${ajuste.nombre}`
      );

      const nuevos = ajustes.filter((a) => a.padre_id !== ajuste.padre_id);
      setAjustes(nuevos);

      // Si ya no quedan ajustes, notificar al padre
      if (nuevos.length === 0) onResuelto();

    } catch (e) {
      onToast(e.message ?? "Error", "err");
    } finally {
      setResolviendo(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={22} className="text-amber-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Resumen */}
      <div className="flex gap-2">
        {resumen.con_devolucion > 0 && (
          <div className="flex-1 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <ArrowDownCircle size={16} className="text-blue-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-blue-700">{resumen.con_devolucion} devolución(es)</p>
              <p className="text-xs text-blue-400">Pagaron de más</p>
            </div>
          </div>
        )}
        {resumen.con_cobro_extra > 0 && (
          <div className="flex-1 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <ArrowUpCircle size={16} className="text-orange-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-orange-700">{resumen.con_cobro_extra} cobro(s) extra</p>
              <p className="text-xs text-orange-400">Deben más</p>
            </div>
          </div>
        )}
      </div>

      {/* Lista */}
      {!ajustes || ajustes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8">
          <CheckCircle size={32} className="text-green-400" />
          <p className="text-sm font-bold text-stone-600">Todos los ajustes resueltos</p>
        </div>
      ) : (
        ajustes.map((a) => {
          const esDevolucion = a.diferencia < 0;
          const monto = Math.abs(a.diferencia).toFixed(2);
          const enProceso = resolviendo === a.padre_id;

          return (
            <div
              key={a.padre_id}
              className="flex items-center gap-3 bg-stone-50 rounded-xl px-4 py-3"
            >
              {/* Info padre */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-stone-700 truncate">{a.nombre}</p>
                <p className="text-xs text-stone-400">{a.codigo}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-stone-400">
                    Pagó: <span className="font-semibold text-stone-600">S/ {Number(a.monto_pagado).toFixed(2)}</span>
                  </span>
                  <span className="text-stone-300">·</span>
                  <span className="text-xs text-stone-400">
                    Debe: <span className="font-semibold text-stone-600">S/ {Number(a.monto_asignado).toFixed(2)}</span>
                  </span>
                </div>
              </div>

              {/* Diferencia + acción */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-sm font-black ${esDevolucion ? "text-blue-500" : "text-orange-500"}`}>
                  {esDevolucion ? "−" : "+"} S/ {monto}
                </span>
                <button
                  onClick={() => handleResolver(a)}
                  disabled={enProceso}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60
                    ${esDevolucion
                      ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                      : "bg-orange-100 text-orange-600 hover:bg-orange-200"
                    }`}
                >
                  {enProceso
                    ? <Loader2 size={12} className="animate-spin" />
                    : esDevolucion ? "Devolver" : "Cobrar"
                  }
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}