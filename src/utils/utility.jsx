import { TrendingDown, TrendingUp } from "lucide-react";

export const formatFecha = (iso) => {
  if (!iso) return "—";
  // Siempre tomamos solo YYYY-MM-DD para evitar desfase UTC
  const [y, m, d] = iso.slice(0, 10).split("-");
  return new Date(+y, +m - 1, +d).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
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
export const StatCardResumen = ({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 p-4">
      <div className="flex items-start justify-between mb-3">
        <div
          className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center`}
        >
          <Icon size={17} className={iconColor} />
        </div>
        {trend === "up" && (
          <TrendingUp size={13} className="text-emerald-400" />
        )}
        {trend === "down" && (
          <TrendingDown size={13} className="text-red-400" />
        )}
      </div>
      <p className="text-xl font-black text-stone-800 leading-tight">{value}</p>
      {sub && <p className="text-[11px] text-stone-400 mt-0.5">{sub}</p>}
      <p className="text-xs text-stone-400 mt-1">{label}</p>
    </div>
  );
};

// ── Fila de metadato con ícono, label y valor ─────────────────────────────────
export function MetaItem({ icon, label, value, muted = false }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] font-bold text-stone-300 uppercase tracking-wide leading-none mb-0.5">
          {label}
        </p>
        <p
          className={`text-xs font-semibold ${muted ? "text-stone-300" : "text-stone-600"}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

// ── Sección con label, ícono y contador ───────────────────────────────────────
export function Section({ label, icon, accent, count, empty, children }) {
  const dotColor = {
    teal: "bg-teal-400",
    blue: "bg-blue-400",
    stone: "bg-stone-300",
  }[accent];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-xs font-black text-stone-500 uppercase tracking-widest flex items-center gap-1">
          {icon} {label}
        </span>
        <span className="ml-1 text-xs font-bold text-stone-300">({count})</span>
      </div>

      {count === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-100 flex items-center justify-center py-8">
          <p className="text-stone-300 text-sm font-medium">{empty}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">{children}</div>
      )}
    </div>
  );
}

// ── Línea divisora punteada ───────────────────────────────────────────────────
export function Divider() {
  return <div className="border-t border-dashed border-stone-200" />;
}

// ── Banner de error ───────────────────────────────────────────────────────────
export function ErrorBanner({ msg }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
      <AlertCircle size={16} className="text-red-400 shrink-0" />
      <p className="text-sm text-red-500 font-medium">{msg}</p>
    </div>
  );
}
