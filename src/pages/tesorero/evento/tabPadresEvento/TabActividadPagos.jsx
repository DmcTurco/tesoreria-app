import { useEffect, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import useApi from "@/hook/useApi";
import { StatCard } from "../../../../utils/utility";

// Vista actividad: estado de pago por padre asignado
export default function TabActividadPagos({ evento, onToast }) {
  const [padres,  setPadres]  = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  const cargar = () => {
    setLoading(true);
    api
      .get(`/eventos/${evento.id}/padres`)
      .then((r) => setPadres(Array.isArray(r) ? r : []))
      .catch(() => onToast("Error al cargar padres", "err"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const pagados    = padres.filter((ep) => (Number(ep.monto_pagado) >= Number(ep.monto_asignado ?? evento.multa_monto))).length;
  const pendientes = padres.filter((ep) => (Number(ep.monto_pagado) < Number(ep.monto_asignado ?? evento.multa_monto))).length;

  return (
    <>
      {!loading && padres.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          <StatCard value={pagados}    label="Pagados"    color="emerald" />
          <StatCard value={pendientes} label="Pendientes" color="amber"   />
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={22} className="text-amber-400 animate-spin" />
        </div>
      ) : padres.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-stone-300">
          <AlertTriangle size={28} strokeWidth={1.5} />
          <p className="text-sm font-medium">Sin padres asignados</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {padres.map((ep) => {
            const asignado = Number(ep.monto_asignado ?? evento.multa_monto ?? 0);
            const pagado   = Number(ep.monto_pagado ?? 0);
            const saldo    = asignado - pagado;
            const completo = saldo <= 0;
            return (
              <div
                key={ep.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-amber-700">
                    {ep.padre?.nombre?.split(" ").slice(0, 2).map((w) => w[0]).join("") ?? "?"}
                  </span>
                </div>

                {/* Nombre + montos */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-stone-700 truncate">
                    {ep.padre?.nombre ?? "—"}
                  </p>
                  <p className="text-[10px] text-stone-400">
                    Pagado: S/ {pagado.toFixed(2)} / S/ {asignado.toFixed(2)}
                  </p>
                </div>

                {/* Badge */}
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border shrink-0
                  ${completo
                    ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                    : "bg-amber-50 border-amber-200 text-amber-600"
                  }`}
                >
                  {completo ? "Pagado" : `S/ ${saldo.toFixed(2)}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
