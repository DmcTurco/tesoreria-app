import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2, Wallet, Check } from "lucide-react";
import { useAbono } from "../../hook/useAbono";
import PadreBuscador from "../../constants/PadreBuscador";
import { Toast } from "../../utils/utility";

export default function NuevoAbono() {
  const navigate = useNavigate();
  const [padreActivo, setPadreActivo] = useState(null);
  const [itemsSel, setItemsSel] = useState([]);
  const [fecha, setFecha] = useState(today());
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { pendientes, loadingPend, getPendientes, registrarAbono } = useAbono();

  useEffect(() => {
    if (!padreActivo?.id) {
      setItemsSel([]);
      return;
    }
    getPendientes(padreActivo.id);
  }, [padreActivo?.id]);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleToggleItem = (item) => {
    setItemsSel((prev) => {
      const yaEsta = prev.find((i) => i.tipo === item.tipo && i.id === item.id);
      if (yaEsta) {
        return prev.filter((i) => !(i.tipo === item.tipo && i.id === item.id));
      }
      return [...prev, { ...item, montoAbono: String(item.saldo) }];
    });
  };

  const handleChangeMonto = (item, valor) => {
    setItemsSel((prev) =>
      prev.map((i) =>
        i.tipo === item.tipo && i.id === item.id
          ? { ...i, montoAbono: valor }
          : i,
      ),
    );
  };

  const totalAPagar = itemsSel.reduce(
    (acc, i) => acc + (Number(i.montoAbono) || 0),
    0,
  );

  const handleSave = async () => {
    if (itemsSel.length === 0) {
      showToast("Selecciona al menos una deuda", "err");
      return;
    }
    for (const item of itemsSel) {
      const monto = Number(item.montoAbono);
      if (!monto || monto <= 0) {
        showToast(`El monto de "${item.label}" debe ser mayor a 0`, "err");
        return;
      }
      if (monto > item.saldo) {
        showToast(
          `"${item.label}" no puede superar S/ ${item.saldo.toFixed(2)}`,
          "err",
        );
        return;
      }
    }

    setLoading(true);
    try {
      await Promise.all(
        itemsSel.map((item) =>
          registrarAbono({
            padre_id: padreActivo.id,
            tipo_deuda: item.tipo,
            deuda_id: item.id,
            monto: Number(item.montoAbono),
            fecha,
          }),
        ),
      );
      navigate("/dashboard/pagos", {
        state: {
          successMsg:
            itemsSel.length === 1
              ? "Abono registrado correctamente"
              : `${itemsSel.length} abonos registrados correctamente`,
        },
      });
    } catch (e) {
      showToast(e.message ?? "Error al registrar abonos", "err");
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Ocupa exactamente el espacio disponible dentro de AppLayout */
    <div className="flex flex-col h-[calc(100dvh-11.5rem)] lg:h-[calc(100vh-3rem)] w-full gap-4">
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      {/* ── 1. Header ───────────────────────────────────────────────── */}
      <div
        className="rounded-2xl px-4 py-4 shrink-0"
        style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shrink-0"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Wallet size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-black text-white leading-tight">
              Registrar abono
            </h1>
            <p className="text-xs text-amber-100 truncate">
              {padreActivo ? padreActivo.nombre : "Selecciona un padre para continuar"}
            </p>
          </div>
        </div>

        {padreActivo?.deuda_total > 0 && (
          <div className="mt-3 bg-white/15 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <p className="text-xs text-amber-100 font-medium">Deuda total</p>
            <p className="text-base font-black text-white">
              S/ {padreActivo.deuda_total.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* ── 2. Buscador (fuera del scroll para que el dropdown no se corte) ── */}
      <div className="shrink-0">
        <PadreBuscador
          value={padreActivo?.id ?? null}
          onChange={(_id, obj) => {
            setPadreActivo(obj);
            setItemsSel([]);
          }}
        />
      </div>

      {/* ── 3. Área scrollable: deudas + fecha ──────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-4 pr-0.5">

        {/* Deudas pendientes */}
        {padreActivo && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Deudas pendientes
              </p>
              {pendientes.length > 0 && (
                <button
                  onClick={() => {
                    if (itemsSel.length === pendientes.length) {
                      setItemsSel([]);
                    } else {
                      setItemsSel(
                        pendientes.map((i) => ({ ...i, montoAbono: String(i.saldo) })),
                      );
                    }
                  }}
                  className="text-xs text-amber-600 font-bold hover:underline"
                >
                  {itemsSel.length === pendientes.length
                    ? "Deseleccionar todas"
                    : "Seleccionar todas"}
                </button>
              )}
            </div>

            {loadingPend ? (
              <div className="flex justify-center py-8">
                <Loader2 size={22} className="text-amber-400 animate-spin" />
              </div>
            ) : pendientes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 bg-emerald-50 rounded-2xl border border-emerald-100">
                <CheckCircle2 size={28} className="text-emerald-400" />
                <p className="text-sm text-emerald-700 font-semibold">Sin deudas pendientes</p>
                <p className="text-xs text-emerald-500">Este padre está al día</p>
              </div>
            ) : (
              pendientes.map((item) => {
                const pct = (item.monto_pagado / item.monto_total) * 100;
                const sel = itemsSel.find(
                  (i) => i.tipo === item.tipo && i.id === item.id,
                );
                return (
                  <div
                    key={`${item.tipo}-${item.id}`}
                    className={`rounded-2xl border-2 px-4 py-3 transition-all
                      ${sel ? "border-amber-400 bg-amber-50 shadow-sm" : "border-stone-100 bg-stone-50"}`}
                  >
                    {/* Checkbox + label + saldo */}
                    <button
                      onClick={() => handleToggleItem(item)}
                      className="w-full text-left flex items-start justify-between gap-2 mb-2"
                    >
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <div
                          className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors
                            ${sel ? "bg-amber-400 border-amber-400" : "border-stone-300 bg-white"}`}
                        >
                          {sel && <Check size={12} className="text-white" strokeWidth={3} />}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5
                            ${item.tipo === "multa" ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"}`}
                        >
                          {item.tipo === "multa" ? "MULTA" : "COBRO"}
                        </span>
                        <p className="text-sm font-semibold text-stone-700 line-clamp-2 leading-snug">
                          {item.label}
                        </p>
                      </div>
                      <p className="text-sm font-black text-stone-800 shrink-0">
                        S/ {item.saldo.toFixed(2)}
                      </p>
                    </button>

                    {/* Barra de progreso */}
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-stone-400 shrink-0 font-medium">
                        S/ {item.monto_pagado.toFixed(2)} / {item.monto_total.toFixed(2)}
                      </span>
                    </div>

                    {/* Input de monto si está seleccionado */}
                    {sel && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-amber-100">
                        <label className="text-xs font-bold text-stone-500 shrink-0">
                          Monto (S/)
                        </label>
                        <input
                          type="number"
                          value={sel.montoAbono}
                          onChange={(e) => handleChangeMonto(item, e.target.value)}
                          max={item.saldo}
                          placeholder="0.00"
                          className="flex-1 h-9 px-3 bg-white border border-amber-200 rounded-xl
                            text-sm text-stone-700 font-bold outline-none focus:border-amber-400 transition-colors"
                        />
                        {Number(sel.montoAbono) > 0 &&
                          (Number(sel.montoAbono) >= item.saldo ? (
                            <span className="text-[10px] text-emerald-600 font-bold shrink-0">Completo ✓</span>
                          ) : (
                            <span className="text-[10px] text-amber-600 font-bold shrink-0">Parcial</span>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Fecha */}
        {itemsSel.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Fecha del abono
            </p>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full h-11 px-3 bg-white border border-stone-200 rounded-xl text-sm
                text-stone-700 outline-none focus:border-amber-400 transition-colors"
            />
          </div>
        )}

        {/* Espacio final para que el contenido no quede tapado por el footer */}
        <div className="shrink-0 h-2" />
      </div>

      {/* ── 4. Footer siempre visible ────────────────────────────────── */}
      <div className="shrink-0 pt-3 border-t border-stone-100">
        {itemsSel.length > 0 && (
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs text-stone-500 font-medium">
              {itemsSel.length} deuda{itemsSel.length > 1 ? "s" : ""} seleccionada{itemsSel.length > 1 ? "s" : ""}
            </p>
            <p className="text-sm font-black text-stone-800">
              Total: S/ {totalAPagar.toFixed(2)}
            </p>
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={loading || itemsSel.length === 0 || !padreActivo}
          className="w-full h-12 rounded-2xl text-sm font-black transition-all
            flex items-center justify-center gap-2
            bg-amber-500 hover:bg-amber-600 text-white
            disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-200"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Guardando...</>
          ) : itemsSel.length > 1 ? (
            `Guardar ${itemsSel.length} abonos`
          ) : (
            "Guardar abono"
          )}
        </button>
      </div>
    </div>
  );
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
