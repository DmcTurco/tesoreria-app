import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, RotateCcw, ShieldOff, UserCheck } from "lucide-react";
import { EVENTO_ESTADO } from "../../../../constants/estados";
import useApi from "@/hook/useApi";
import { StatCard } from "../../../../utils/utility";
import { ESTADO_CONFIG } from "./estadoConfig";
import ModalExonerar from "./ModalExonerar";

// Vista plana: faena, reunión, cuota — lista de padres con asistencia y exoneración
export default function TabPadresPlano({ evento, onToast, esTesorero }) {
  const [padres,      setPadres]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modalEx,     setModalEx]     = useState(null);
  const [marcando,    setMarcando]    = useState(null); // padre_id en proceso
  const [revertiendo, setRevertiendo] = useState(null); // ep.id en proceso
  const api = useApi();

  const revertirExoneracion = async (ep) => {
    if (!window.confirm(`¿Revertir exoneración de ${ep.padre?.nombre ?? "este padre"}?`)) return;
    setRevertiendo(ep.id);
    try {
      await api.put(`/evento-padres/${ep.id}/revertir-exoneracion`);
      onToast("Exoneración revertida");
      cargar();
    } catch (e) {
      onToast(e.message ?? "Error al revertir", "err");
    } finally {
      setRevertiendo(null);
    }
  };

  const marcarAsistencia = async (ep) => {
    setMarcando(ep.padre_id);
    try {
      await api.post(`/eventos/${evento.id}/asistencia`, {
        padre_id: ep.padre_id,
        fecha:    ep.fecha ?? undefined,
      });
      onToast("Asistencia registrada");
      cargar();
    } catch (e) {
      onToast(e.message ?? "Error al registrar asistencia", "err");
    } finally {
      setMarcando(null);
    }
  };

  const cargar = () => {
    setLoading(true);
    api
      .get(`/eventos/${evento.id}/padres`)
      .then((r) => setPadres(Array.isArray(r) ? r : []))
      .catch(() => onToast("Error al cargar padres", "err"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const presentes  = padres.filter((ep) => ep.estado === 1).length;
  const ausentes   = padres.filter((ep) => ep.estado === 2).length;
  const pendientes = padres.filter((ep) => ep.estado === 0).length;

  return (
    <>
      {!loading && padres.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatCard value={presentes}  label="Presentes"  color="emerald" />
          <StatCard value={ausentes}   label="Ausentes"   color="red"     />
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
            const cfg  = ESTADO_CONFIG[ep.estado] ?? ESTADO_CONFIG[0];
            const Icon = cfg.icon;
            return (
              <div
                key={ep.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-stone-50 transition-colors group"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-amber-700">
                    {ep.padre?.nombre?.split(" ").slice(0, 2).map((w) => w[0]).join("") ?? "?"}
                  </span>
                </div>

                {/* Nombre */}
                <p className="flex-1 text-xs font-semibold text-stone-700 truncate min-w-0">
                  {ep.padre?.nombre ?? "—"}
                </p>

                {/* Badge estado */}
                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border shrink-0
                  ${cfg.bg} ${cfg.border} ${cfg.color}`}
                >
                  <Icon size={9} strokeWidth={2.5} />
                  {cfg.label}
                </span>

                {/* Botón marcar asistencia — solo pendientes */}
                {esTesorero && evento.estado === EVENTO_ESTADO.ACTIVO && ep.estado === 0 && (
                  <button
                    onClick={() => marcarAsistencia(ep)}
                    disabled={marcando === ep.padre_id}
                    title="Marcar asistencia"
                    className="w-7 h-7 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-100
                      flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {marcando === ep.padre_id
                      ? <Loader2 size={12} className="text-emerald-400 animate-spin" />
                      : <UserCheck size={12} className="text-emerald-500" />
                    }
                  </button>
                )}

                {/* Botón exonerar — solo tesorero, activo, pendiente o presente */}
                {esTesorero && evento.estado === EVENTO_ESTADO.ACTIVO && [0, 1].includes(ep.estado) && (
                  <button
                    onClick={() => setModalEx(ep)}
                    title="Exonerar"
                    className="w-7 h-7 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-100
                      flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <ShieldOff size={12} className="text-purple-400" />
                  </button>
                )}

                {/* Botón revertir exoneración — solo tesorero, exonerado */}
                {esTesorero && ep.estado === 4 && (
                  <button
                    onClick={() => revertirExoneracion(ep)}
                    disabled={revertiendo === ep.id}
                    title="Revertir exoneración"
                    className="w-7 h-7 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-100
                      flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {revertiendo === ep.id
                      ? <Loader2 size={12} className="text-amber-400 animate-spin" />
                      : <RotateCcw size={12} className="text-amber-500" />
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalEx && (
        <ModalExonerar
          ep={modalEx}
          evento={evento}
          onClose={() => setModalEx(null)}
          onDone={() => { setModalEx(null); cargar(); onToast("Padre exonerado"); }}
          onError={onToast}
        />
      )}
    </>
  );
}
