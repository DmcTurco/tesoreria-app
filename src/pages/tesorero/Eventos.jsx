import { useEffect, useState } from "react";
import {
  Plus,
  CalendarDays,
  ChevronRight,
  Loader2,
  X,
  CheckSquare,
  AlertCircle,
  Users,
  Check,
} from "lucide-react";
import { useEventos } from "@/hook/useEventos";
import { usePadres } from "@/hook/usePadres";
import { EVENTO_TIPO_LABEL, EVENTO_ESTADO } from "../../constants/estados";
import useApi from "@/hook/useApi";
import CrearEvento from "./evento/CrearEvento";
import DetalleEvento from "./evento/DetalleEvento";
import AsignarPadres from "./evento/AsignarPadres";
import { Toast } from "../../utils/utility";
import EventoCard from "./evento/EventoCard";

export default function Eventos() {
  const [creando, setCreando] = useState(false);
  const [asignar, setAsignar] = useState(null); // evento para asignar padres
  const [toast, setToast] = useState(null);
  const [detalle, setDetalle] = useState(null);

  const { loading, error, eventos, getEventos, createEvento, cerrarEvento } =
    useEventos();

  useEffect(() => {
    getEventos();
  }, []);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleCerrar = async (evento) => {
    if (
      !confirm(
        `¿Cerrar el evento "${evento.titulo}"? Se generarán multas a los ausentes.`,
      )
    )
      return;
    try {
      await cerrarEvento(evento.id);
      showToast("Evento cerrado y multas generadas");
      getEventos();
    } catch (e) {
      showToast(e.message ?? "Error", "err");
    }
  };

  return (
    <>
      {/* Vista crear */}
      {creando && (
        <CrearEvento
          onBack={() => setCreando(false)}
          onCreated={(msg) => {
            setCreando(false);
            showToast(msg);
            getEventos();
          }}
        />
      )}

      {/* ← Vista detalle — mismo patrón que creando */}
      {detalle && !creando && (
        <DetalleEvento
          evento={detalle}
          onBack={() => setDetalle(null)}
          onSaved={(msg) => {
            setDetalle(null);
            showToast(msg);
            getEventos();
          }}
          onToast={showToast}
        />
      )}

      {asignar && !creando && !detalle && (
        <AsignarPadres
          evento={asignar}
          onBack={() => setAsignar(null)}
          onDone={(msg) => {
            setAsignar(null);
            showToast(msg);
            getEventos();
          }}
          onToast={showToast}
        />
      )}

      {/* Lista principal — se oculta cuando hay detalle o creando */}
      {!creando && !detalle && !asignar && (
        <div className="flex flex-col gap-5">
          {toast && <Toast msg={toast.msg} type={toast.type} />}

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-stone-800">Eventos</h1>
              <p className="text-sm text-stone-400">
                {
                  eventos.filter((e) => e.estado === EVENTO_ESTADO.ACTIVO)
                    .length
                }{" "}
                activos
              </p>
            </div>
            <button
              onClick={() => setCreando(true)}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus size={16} /> Nuevo evento
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <p className="text-sm text-red-500 font-medium">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={24} className="text-amber-400 animate-spin" />
              </div>
            ) : eventos.length === 0 ? (
              <p className="text-center text-stone-400 text-sm py-10">
                Sin eventos
              </p>
            ) : (
              eventos.map((e) => (
                <EventoCard
                  key={e.id}
                  evento={e}
                  onDetalle={() => setDetalle(e)}
                  onCerrar={() => handleCerrar(e)}
                  onAsignar={() => setAsignar(e)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
