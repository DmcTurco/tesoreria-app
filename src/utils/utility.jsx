import { TrendingDown, TrendingUp } from "lucide-react";

export const formatFecha = (iso) => {
  if (!iso) return "—";
  const fecha = iso.includes("T") ? new Date(iso) : new Date(iso + "T00:00:00");
  return fecha.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-stone-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-10 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 outline-none focus:border-amber-400 transition-colors"
      />
    </div>
  );
};

export const Row = ({ label, value }) => {
  return (
    <div className="flex justify-between items-center px-4 py-2.5">
      <span className="text-xs text-stone-400">{label}</span>
      <span className="text-xs font-semibold text-stone-700 text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
};

export const Toast = ({ msg, type }) => {
  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-bold shadow-lg
      ${type === "err" ? "bg-red-500 text-white" : "bg-stone-800 text-white"}`}
    >
      {msg}
    </div>
  );
};

// ── Atom: tarjeta de estadística ──────────────────────────────────────────────
export const StatCard = ({ value, label, color }) => {
  const colors = {
    stone: { bg: "bg-stone-50", text: "text-stone-600" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600" },
    amber: { bg: "bg-amber-50", text: "text-amber-600" },
    red: { bg: "bg-red-50", text: "text-red-500" },
    purple: { bg: "bg-purple-50", text: "text-purple-600" },
  };
  const c = colors[color] ?? colors.stone;
  return (
    <div className={`${c.bg} rounded-xl py-2.5 text-center`}>
      <p className={`text-lg font-black ${c.text}`}>{value}</p>
      <p className="text-[10px] text-stone-400 font-medium">{label}</p>
    </div>
  );
};

// ── Atoms ─────────────────────────────────────────────────────────────────────
export const StatCardResumen=({ label, value, sub, icon: Icon, iconBg, iconColor, trend }) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon size={17} className={iconColor} />
        </div>
        {trend === "up"   && <TrendingUp   size={13} className="text-emerald-400" />}
        {trend === "down" && <TrendingDown size={13} className="text-red-400" />}
      </div>
      <p className="text-xl font-black text-stone-800 leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-stone-400 mt-0.5">{sub}</p>}
      <p className="text-xs text-stone-400 mt-1">{label}</p>
    </div>
  );
}
