import { useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarClock,
  CalendarCheck2,
  Loader2,
} from "lucide-react";
import { useEventos } from "../../hook/useEventos";
import { esActivo, esPasado, esProximo, hoy } from "../profesora/hoy/eventoHelpers";
import { CardActivo, CardCompacto } from "./hoy/EventoCards";
import { Section, Divider, ErrorBanner, Toast } from "../../utils/utility";
import DetalleEvento from "./hoy/DetalleEvento";

export default function Hoy() {
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);

  const { loading, error, eventos, getEventos } = useEventos();

  useEffect(() => {
    getEventos();
  }, []);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const activos = eventos
    .filter(esActivo)
    .sort((a, b) => a.fecha_inicio?.localeCompare(b.fecha_inicio));
  const proximos = eventos
    .filter(esProximo)
    .sort((a, b) => a.fecha_inicio?.localeCompare(b.fecha_inicio));
  const pasados = eventos
    .filter(esPasado)
    .sort((a, b) => b.fecha_fin?.localeCompare(a.fecha_fin));

  // ── Si hay evento seleccionado → mostrar detalle completo ──
  if (selected) {
    return (
      <>
        {toast && <Toast msg={toast.msg} type={toast.type} />}
        <DetalleEvento
          evento={selected}
          fecha={hoy}
          onVolver={() => setSelected(null)}
          onToast={showToast}
        />
      </>
    );
  }

  // ── Listado de eventos ──
  return (
    <div className="flex flex-col gap-6">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div>
        <h1 className="text-xl font-black text-stone-800">Eventos</h1>
        <p className="text-sm text-stone-400">
          {new Date().toLocaleDateString("es-PE", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {error && <ErrorBanner msg={error} />}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 size={24} className="text-teal-400 animate-spin" />
        </div>
      ) : (
        <>
          <Section
            label="Activos hoy"
            icon={<CalendarDays size={14} className="text-teal-500" />}
            accent="teal"
            count={activos.length}
            empty="Sin eventos activos hoy"
          >
            {activos.map((e) => (
              <CardActivo
                key={e.id}
                evento={e}
                onClick={() => setSelected(e)}
              />
            ))}
          </Section>

          <Divider />

          <Section
            label="Próximos"
            icon={<CalendarClock size={14} className="text-blue-400" />}
            accent="blue"
            count={proximos.length}
            empty="Sin eventos próximos"
          >
            {proximos.map((e) => (
              <CardCompacto
                key={e.id}
                evento={e}
                onClick={() => setSelected(e)}
                muted={false}
              />
            ))}
          </Section>

          <Divider />

          <Section
            label="Pasados"
            icon={<CalendarCheck2 size={14} className="text-stone-400" />}
            accent="stone"
            count={pasados.length}
            empty="Sin eventos pasados"
          >
            {pasados.map((e) => (
              <CardCompacto
                key={e.id}
                evento={e}
                onClick={() => setSelected(e)}
                muted
              />
            ))}
          </Section>
        </>
      )}
    </div>
  );
}
