import TabGuardiaPorFechas from "./tabPadresEvento/TabGuardiaPorFechas";
import TabActividadPagos from "./tabPadresEvento/TabActividadPagos";
import TabPadresPlano from "./tabPadresEvento/TabPadresPlano";

/**
 * Pestaña "Padres" del detalle de evento — selector por tipo:
 * - Guardia (0)   → TabGuardiaPorFechas: fechas con padres por día y turnos
 * - Actividad (4) → TabActividadPagos:   estado de pago por padre
 * - Resto         → TabPadresPlano:      asistencia y exoneración
 *
 * Componentes compartidos en ./tabPadresEvento/:
 * ModalExonerar, ModalQuitarPadre, ModalTurnos, PadreChips, estadoConfig.
 */
export default function TabPadresEvento({ evento, onToast, esTesorero }) {
  if (evento.tipo === 0) {
    return <TabGuardiaPorFechas evento={evento} onToast={onToast} esTesorero={esTesorero} />;
  }
  if (evento.tipo === 4) {
    return <TabActividadPagos evento={evento} onToast={onToast} esTesorero={esTesorero} />;
  }
  return <TabPadresPlano evento={evento} onToast={onToast} esTesorero={esTesorero} />;
}
