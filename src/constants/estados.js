// Deben coincidir exactamente con las constantes del backend (Models)

export const USER_ROLE = { TESORERO: 0, PROFESORA: 1, PADRE: 2 };

export const EVENTO_TIPO = {
    GUARDIA: 0, FAENA: 1, REUNION: 2, COBRO: 3, ACTIVIDAD: 4,
};
export const EVENTO_TIPO_LABEL = {
    0: "Guardia", 1: "Faena", 2: "Reunión", 3: "Cobro", 4: "Actividad",
};

export const EVENTO_ESTADO = { ACTIVO: 0, CERRADO: 1 };

export const EVENTO_PADRE_ESTADO = {
    PENDIENTE: 0, PRESENTE: 1, AUSENTE: 2, JUSTIFICADO: 3, EXONERADO: 4,
};
export const EVENTO_PADRE_ESTADO_LABEL = {
    0: "Pendiente", 1: "Presente", 2: "Ausente", 3: "Justificado", 4: "Exonerado",
};

export const PAGO_ESTADO = { PENDIENTE: 0, PAGADO: 1, ANULADO: 2 };
export const PAGO_ESTADO_LABEL = { 0: "Pendiente", 1: "Pagado", 2: "Anulado" };

export const MULTA_ESTADO = { PENDIENTE: 0, PAGADO: 1, EXONERADO: 2, ANULADO: 3 };
export const MULTA_ESTADO_LABEL = {
    0: "Pendiente", 1: "Pagado", 2: "Exonerado", 3: "Anulado",
};

export const MOVIMIENTO_TIPO = { INGRESO: 0, EGRESO: 1 };
export const MOVIMIENTO_TIPO_LABEL = { 0: "Ingreso", 1: "Egreso" };