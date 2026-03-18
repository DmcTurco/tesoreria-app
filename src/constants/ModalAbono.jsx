// components/ModalAbono.jsx
import { useState, useEffect } from "react";
import { X, Loader2, CheckCircle2, Wallet } from "lucide-react";
import useApi from "@/hook/useApi";
import PadreBuscador from "./PadreBuscador";

export default function ModalAbono({ onClose, onSuccess, onError }) {
  const [padreActivo, setPadreActivo] = useState(null);
  const [pendientes, setPendientes] = useState([]);
  const [loadingPend, setLoadingPend] = useState(false);
  const [itemSel, setItemSel] = useState(null);
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(today());
  const [loading, setLoading] = useState(false);
  const api = useApi();

  useEffect(() => {
    if (!padreActivo?.id) {
      setPendientes([]);
      setItemSel(null);
      setMonto("");
      return;
    }
    setLoadingPend(true);
    api
      .get("/mi-estado-tesorero", { params: { padre_id: padreActivo.id } })
      .then((r) => {
        const items = [];
        (r.multas ?? [])
          .filter((m) => m.estado === 0 || m.estado === 1)
          .forEach((m) => {
            const saldo = Number(m.monto) - Number(m.monto_pagado ?? 0);
            if (saldo > 0)
              items.push({
                tipo: "multa",
                id: m.id,
                label: m.concepto,
                monto_total: Number(m.monto),
                monto_pagado: Number(m.monto_pagado ?? 0),
                saldo,
              });
          });
        (r.cobros ?? [])
          .filter((ep) => ep.estado === 0 || ep.estado === 1)
          .forEach((ep) => {
            const total = Number(ep.evento?.multa_monto ?? 0);
            const pagado = Number(ep.monto_pagado ?? 0);
            const saldo = total - pagado;
            if (saldo > 0)
              items.push({
                tipo: "cobro",
                id: ep.id,
                label: ep.evento?.titulo ?? "—",
                monto_total: total,
                monto_pagado: pagado,
                saldo,
              });
          });
        setPendientes(items);
      })
      .catch(() => setPendientes([]))
      .finally(() => setLoadingPend(false));
  }, [padreActivo?.id]);

  const handleSelItem = (item) => {
    setItemSel(item);
    setMonto(String(item.saldo));
  };

  const handleSave = async () => {
    if (!itemSel) {
      onError("Selecciona una deuda");
      return;
    }
    if (!monto || Number(monto) <= 0) {
      onError("El monto debe ser mayor a 0");
      return;
    }
    if (Number(monto) > itemSel.saldo) {
      onError(
        `No puede superar el saldo pendiente (S/ ${itemSel.saldo.toFixed(2)})`,
      );
      return;
    }
    setLoading(true);
    try {
      await api.post("/abonos", {
        padre_id: padreActivo.id,
        tipo_deuda: itemSel.tipo,
        deuda_id: itemSel.id,
        monto: Number(monto),
        fecha,
      });
      onSuccess("Abono registrado correctamente");
      onClose();
    } catch (e) {
      onError(e.message ?? "Error al registrar abono");
    } finally {
      setLoading(false);
    }
  };

  const saldoRestante = itemSel && monto ? itemSel.saldo - Number(monto) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ height: "calc(80vh - 80px)", marginTop: "60px" }}
      >
        {/* ── Header con gradiente ─────────────────────────────────────────── */}
        <div
          className="relative px-6 pt-6 pb-5 shrink-0"
          style={{
            background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                <Wallet size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">
                  Registrar abono
                </h2>
                <p className="text-xs text-amber-100">
                  {padreActivo
                    ? padreActivo.nombre
                    : "Selecciona un padre para continuar"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
          </div>

          {/* Deuda total del padre seleccionado */}
          {padreActivo?.deuda_total > 0 && (
            <div className="mt-4 bg-white/15 rounded-2xl px-4 py-3 flex items-center justify-between">
              <p className="text-xs text-amber-100 font-medium">
                Deuda total del padre
              </p>
              <p className="text-lg font-black text-white">
                S/ {padreActivo.deuda_total.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* ── Cuerpo scrollable ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* 1. Buscador */}
          <div>
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
              Padre / Madre
            </p>
            <PadreBuscador
              value={padreActivo?.id ?? null}
              onChange={(id, obj) => {
                setPadreActivo(obj);
                setItemSel(null);
                setMonto("");
              }}
            />
          </div>

          {/* 2. Deudas */}
          {padreActivo && (
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Deudas pendientes
              </p>

              {loadingPend ? (
                <div className="flex justify-center py-8">
                  <Loader2 size={22} className="text-amber-400 animate-spin" />
                </div>
              ) : pendientes.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <CheckCircle2 size={28} className="text-emerald-400" />
                  <p className="text-sm text-emerald-700 font-semibold">
                    Sin deudas pendientes
                  </p>
                  <p className="text-xs text-emerald-500">
                    Este padre está al día
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {pendientes.map((item) => {
                    const pct = (item.monto_pagado / item.monto_total) * 100;
                    const sel =
                      itemSel?.tipo === item.tipo && itemSel?.id === item.id;
                    return (
                      <button
                        key={`${item.tipo}-${item.id}`}
                        onClick={() => handleSelItem(item)}
                        className={`w-full text-left rounded-2xl border-2 px-4 py-3 transition-all
                          ${
                            sel
                              ? "border-amber-400 bg-amber-50 shadow-sm"
                              : "border-stone-100 bg-stone-50 hover:border-amber-200 hover:bg-amber-50/50"
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                              ${
                                item.tipo === "multa"
                                  ? "bg-red-100 text-red-600"
                                  : "bg-orange-100 text-orange-600"
                              }`}
                            >
                              {item.tipo === "multa" ? "MULTA" : "COBRO"}
                            </span>
                            <p className="text-sm font-semibold text-stone-700 truncate max-w-[200px]">
                              {item.label}
                            </p>
                          </div>
                          <p className="text-sm font-black text-stone-800 shrink-0">
                            S/ {item.saldo.toFixed(2)}
                          </p>
                        </div>
                        {/* Barra de progreso */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-stone-400 shrink-0 font-medium">
                            S/ {item.monto_pagado.toFixed(2)} /{" "}
                            {item.monto_total.toFixed(2)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 3. Monto y fecha */}
          {itemSel && (
            <div>
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
                Detalle del abono
              </p>
              <div className="bg-stone-50 rounded-2xl border border-stone-100 p-4 flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-stone-600">
                      Monto a abonar (S/)
                    </label>
                    <input
                      type="number"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      max={itemSel.saldo}
                      placeholder="0.00"
                      className="h-11 px-3 bg-white border border-stone-200 rounded-xl text-sm
                        text-stone-700 font-bold outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-stone-600">
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="h-11 px-3 bg-white border border-stone-200 rounded-xl text-sm
                        text-stone-700 outline-none focus:border-amber-400 transition-colors"
                    />
                  </div>
                </div>

                {monto &&
                  Number(monto) > 0 &&
                  saldoRestante !== null &&
                  (saldoRestante > 0 ? (
                    <div className="flex items-center justify-between bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                      <p className="text-xs text-amber-700 font-semibold">
                        Pago parcial
                      </p>
                      <p className="text-xs text-amber-700 font-black">
                        Queda S/ {saldoRestante.toFixed(2)}
                      </p>
                    </div>
                  ) : saldoRestante === 0 ? (
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                      <CheckCircle2
                        size={14}
                        className="text-emerald-500 shrink-0"
                      />
                      <p className="text-xs text-emerald-700 font-semibold">
                        Pago completo — deuda saldada ✓
                      </p>
                    </div>
                  ) : null)}
              </div>
            </div>
          )}
        </div>

        {/* ── Footer fijo ──────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-stone-100 bg-white shrink-0">
          <button
            onClick={handleSave}
            disabled={loading || !itemSel || !padreActivo}
            className="w-full h-12 rounded-2xl text-sm font-black transition-all
              flex items-center justify-center gap-2
              bg-amber-500 hover:bg-amber-600 text-white
              disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-200"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Guardando...
              </>
            ) : (
              "Guardar abono"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
