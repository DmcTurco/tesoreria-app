import { useEffect, useState } from "react";
import api from "../services/api";

const TIPO_LABELS = { 0: "Turno / Faena", 1: "Reunión", 2: "Actividad" };
const ESTADO_COLOR = { 0: "#22c55e", 1: "#f59e0b", 2: "#6b7280" };
const ESTADO_LABEL = { 0: "Activo", 1: "Cerrado", 2: "Cancelado" };

export default function EventoDetalleModal({ eventoId, onClose }) {
  const [evento, setEvento] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/eventos/${eventoId}`)
      .then((res) => setEvento(res.data))
      .finally(() => setLoading(false));
  }, [eventoId]);

  if (loading)
    return (
      <div className="modal-overlay">
        <div className="modal-box">Cargando...</div>
      </div>
    );

  const {
    titulo,
    descripcion,
    tipo,
    lugar,
    hora_inicio,
    hora_fin,
    fecha_inicio,
    fecha_fin,
    multa_monto,
    tiene_multa,
    padres_por_dia,
    estado,
    padres = [],
  } = evento;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box large" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>{titulo}</h2>
          <span
            style={{
              background: ESTADO_COLOR[estado],
              color: "#fff",
              padding: "2px 10px",
              borderRadius: 12,
              fontSize: 12,
            }}
          >
            {ESTADO_LABEL[estado]}
          </span>
          <button className="btn-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Info general */}
        <div className="detalle-grid">
          <div className="detalle-item">
            <span className="label">📋 Tipo</span>
            <span>{TIPO_LABELS[tipo]}</span>
          </div>
          <div className="detalle-item">
            <span className="label">📍 Lugar</span>
            <span>{lugar}</span>
          </div>
          <div className="detalle-item">
            <span className="label">🕐 Horario</span>
            <span>
              {hora_inicio?.slice(0, 5)} – {hora_fin?.slice(0, 5)}
            </span>
          </div>
          <div className="detalle-item">
            <span className="label">📅 Fechas</span>
            <span>
              {new Date(fecha_inicio).toLocaleDateString("es-PE")} →{" "}
              {new Date(fecha_fin).toLocaleDateString("es-PE")}
            </span>
          </div>
          {tiene_multa && (
            <div className="detalle-item">
              <span className="label">⚠️ Multa</span>
              <span>S/ {multa_monto}</span>
            </div>
          )}
          {padres_por_dia && (
            <div className="detalle-item">
              <span className="label">👥 Padres/día</span>
              <span>{padres_por_dia}</span>
            </div>
          )}
        </div>

        {descripcion && <p className="detalle-descripcion">{descripcion}</p>}

        {/* Padres asignados */}
        <h3 style={{ marginTop: 16 }}>👨‍👩‍👧 Padres asignados ({padres.length})</h3>
        {padres.length === 0 ? (
          <p className="text-muted">Sin padres asignados aún.</p>
        ) : (
          <table className="tabla-padres">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>DNI</th>
                <th>Fecha turno</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {padres.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{p.dni}</td>
                  <td>
                    {p.pivot.fecha
                      ? new Date(p.pivot.fecha).toLocaleDateString("es-PE")
                      : "—"}
                  </td>
                  <td>
                    <span className={`badge-estado estado-${p.pivot.estado}`}>
                      {["Pendiente", "Asistió", "Falta", "Reemplazo"][
                        p.pivot.estado
                      ] ?? "?"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
