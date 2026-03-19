// Deben coincidir exactamente con las constantes del backend (Models)

export const USER_ROLE = { TESORERO: 0, PROFESORA: 1, PADRE: 2 };

export const EVENTO_TIPO = {
    GUARDIA: 0, FAENA: 1, REUNION: 2, CUOTA: 3, ACTIVIDAD: 4,
};
export const EVENTO_TIPO_LABEL = {
    0: "Guardia", 1: "Faena", 2: "Reunión", 3: "Cuota", 4: "Actividad", // ← Cobro → Cuota
};

export const EVENTO_ESTADO = { ACTIVO: 0, CERRADO: 1 };

export const EVENTO_PADRE_ESTADO = {
    PENDIENTE: 0, PRESENTE: 1, AUSENTE: 2, JUSTIFICADO: 3, EXONERADO: 4,
};
export const EVENTO_PADRE_ESTADO_LABEL = {
    0: "Pendiente", 1: "Presente", 2: "Ausente", 3: "Justificado", 4: "Exonerado",
};

// ← PAGO_ESTADO deprecado — ya no se usa en el flujo principal
// export const PAGO_ESTADO = ...

export const MULTA_ESTADO = { PENDIENTE: 0, PARCIAL: 1, PAGADO: 2, EXONERADO: 3, ANULADO: 4 }; // ← PARCIAL agregado
export const MULTA_ESTADO_LABEL = {
    0: "Pendiente", 1: "Parcial", 2: "Pagado", 3: "Exonerado", 4: "Anulado",   // ← ajustado
};

export const ABONO_ESTADO = { ACTIVO: 0, ANULADO: 1 }; // ← nuevo
export const ABONO_ESTADO_LABEL = { 0: "Activo", 1: "Anulado" };              // ← nuevo

export const ABONO_TIPO_LABEL = { multa: "Multa", cobro: "Cuota" };           // ← nuevo

export const MOVIMIENTO_TIPO = { INGRESO: 0, EGRESO: 1 };
export const MOVIMIENTO_TIPO_LABEL = { 0: "Ingreso", 1: "Egreso" };