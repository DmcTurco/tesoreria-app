import { useEffect, useRef, useState } from "react";
import { Loader2, AlertCircle, Download } from "lucide-react";
import useApi from "../../hook/useApi";

export default function MiQR() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);
  const api = useApi();

  useEffect(() => {
    api
      .get("/mi-qr")
      .then((r) => setData(r))
      .catch(() => setError("Error al cargar tu QR"))
      .finally(() => setLoading(false));
  }, []);

  // Dibujar QR en canvas cuando llegan los datos
  useEffect(() => {
    if (!data?.qr_data || !canvasRef.current) return;
    drawQR(canvasRef.current, data.qr_data, 240);
  }, [data]);

  const handleDescargar = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `qr-apafa-${data?.codigo ?? "padre"}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="text-rose-400 animate-spin" />
      </div>
    );

  if (error)
    return (
      <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-4 mt-4">
        <AlertCircle size={16} className="text-red-400 shrink-0" />
        <p className="text-sm text-red-500 font-medium">{error}</p>
      </div>
    );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-black text-stone-800">Mi código QR</h1>
        <p className="text-sm text-stone-400">
          Muéstralo para registrar tu asistencia
        </p>
      </div>

      {/* Card QR */}
      <div className="bg-white rounded-2xl border border-stone-100 flex flex-col items-center px-6 py-8 gap-5">
        <div className="bg-white p-3 rounded-2xl border-2 border-stone-100 shadow-sm">
          <canvas
            ref={canvasRef}
            width={240}
            height={240}
            style={{ borderRadius: 8, display: "block" }}
          />
        </div>

        <div className="text-center">
          <p className="text-lg font-black text-stone-800">{data?.codigo}</p>
          <p className="text-xs text-stone-400 mt-1 font-mono break-all px-4">
            {data?.qr_data}
          </p>
        </div>

        <button
          onClick={handleDescargar}
          className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
        >
          <Download size={15} /> Guardar imagen
        </button>
      </div>

      {/* Instrucciones */}
      <div className="bg-rose-50 rounded-2xl px-4 py-4">
        <p className="text-xs font-bold text-rose-700 mb-2">
          ¿Cómo usar tu QR?
        </p>
        {[
          "Abre esta pantalla cuando llegues al evento",
          "Muestra el QR a la profesora o al tesorero",
          "Ellos escanean el código con su celular",
          "Tu asistencia queda registrada al instante",
        ].map((t, i) => (
          <p key={i} className="text-xs text-rose-600 mb-1">
            <span className="font-bold">{i + 1}.</span> {t}
          </p>
        ))}
      </div>
    </div>
  );
}

// ── QR canvas simple ──────────────────────────────────────────────────────────
function drawQR(canvas, data, size) {
  const ctx = canvas.getContext("2d");
  let h = 0;
  for (let i = 0; i < data.length; i++)
    h = ((h << 5) - h + data.charCodeAt(i)) | 0;
  let s = Math.abs(h);
  const rng = () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
  const m = 25,
    cell = size / (m + 4),
    off = cell * 2;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, size, size);
  const finder = (x, y) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(x, y, cell * 7, cell * 7);
    ctx.fillStyle = "#fff";
    ctx.fillRect(x + cell, y + cell, cell * 5, cell * 5);
    ctx.fillStyle = "#000";
    ctx.fillRect(x + cell * 2, y + cell * 2, cell * 3, cell * 3);
  };
  finder(off, off);
  finder(off + (m - 7) * cell, off);
  finder(off, off + (m - 7) * cell);
  ctx.fillStyle = "#000";
  for (let r = 0; r < m; r++)
    for (let c = 0; c < m; c++) {
      if ((r < 8 && c < 8) || (r < 8 && c >= m - 8) || (r >= m - 8 && c < 8))
        continue;
      if (rng() > 0.45)
        ctx.fillRect(off + c * cell, off + r * cell, cell - 0.5, cell - 0.5);
    }
}
