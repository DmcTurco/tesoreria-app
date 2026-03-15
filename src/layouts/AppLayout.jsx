import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ArrowLeftRight,
  CalendarDays,
  AlertTriangle,
  PiggyBank,
  LogOut,
  Menu,
  X,
  Building2,
  ChevronRight,
} from "lucide-react";

// nav por rol
const NAV_TESORERO = [
  { key: "resumen", label: "Resumen", icon: LayoutDashboard },
  { key: "padres", label: "Padres", icon: Users },
  { key: "pagos", label: "Pagos", icon: CreditCard },
  { key: "movimientos", label: "Movimientos", icon: ArrowLeftRight },
  { key: "eventos", label: "Eventos", icon: CalendarDays },
  { key: "multas", label: "Multas", icon: AlertTriangle },
  { key: "presupuesto", label: "Presupuesto", icon: PiggyBank },
];

const NAV_PROFESORA = [
  { key: "hoy", label: "Hoy", icon: CalendarDays },
  { key: "escanear", label: "Escanear QR", icon: Users },
  { key: "historial", label: "Historial", icon: ArrowLeftRight },
];

const NAV_PADRE = [
  { key: "estado", label: "Mi estado", icon: LayoutDashboard },
  { key: "qr", label: "Mi QR", icon: Users },
  { key: "eventos", label: "Eventos", icon: CalendarDays },
];

const NAV_BY_ROLE = { 0: NAV_TESORERO, 1: NAV_PROFESORA, 2: NAV_PADRE };

export default function AppLayout({ user, tab, onTabChange, children }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const nav = NAV_BY_ROLE[user?.role] ?? NAV_TESORERO;

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    navigate("/role");
  };

  const initials =
    user?.name
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() ?? "U";

  return (
    <div className="min-h-screen bg-stone-50 flex">
      {/* ── Sidebar desktop ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-56 bg-white border-r border-stone-100 fixed top-0 left-0 h-screen z-20">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-stone-100">
          <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-white" strokeWidth={1.8} />
          </div>
          <div>
            <p className="text-sm font-black text-stone-800 tracking-wide">
              Tesorería
            </p>
            <p className="text-[10px] text-stone-400 font-medium">APAFA</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
          {nav.map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => onTabChange(key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all text-left
                  ${
                    active
                      ? "bg-amber-50 text-amber-700"
                      : "text-stone-500 hover:bg-stone-50 hover:text-stone-700"
                  }`}
              >
                <Icon
                  size={17}
                  strokeWidth={active ? 2.2 : 1.8}
                  className={active ? "text-amber-500" : "text-stone-400"}
                />
                {label}
                {active && (
                  <ChevronRight size={13} className="ml-auto text-amber-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-stone-100">
          <div className="flex items-center gap-2 px-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-black text-amber-700">
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-stone-700 truncate">
                {user?.name}
              </p>
              <p className="text-[10px] text-stone-400 truncate">
                {user?.username}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-stone-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Mobile header ───────────────────────────────────────────── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-stone-100 z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
            <Building2 size={15} className="text-white" strokeWidth={1.8} />
          </div>
          <span className="text-sm font-black text-stone-800 tracking-wide">
            Tesorería
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <span className="text-xs font-black text-amber-700">
              {initials}
            </span>
          </div>
          <button onClick={() => setOpen(true)} className="p-1 text-stone-500">
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ───────────────────────────────────────────── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-30">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <p className="font-black text-stone-800">Menú</p>
              <button onClick={() => setOpen(false)}>
                <X size={20} className="text-stone-400" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
              {nav.map(({ key, label, icon: Icon }) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      onTabChange(key);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all text-left
                      ${active ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:bg-stone-50"}`}
                  >
                    <Icon
                      size={17}
                      className={active ? "text-amber-500" : "text-stone-400"}
                    />
                    {label}
                  </button>
                );
              })}
            </nav>
            <div className="px-3 py-4 border-t border-stone-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom nav mobile ────────────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-stone-100 flex">
        {nav.slice(0, 5).map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors
                ${active ? "text-amber-500" : "text-stone-400"}`}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
              <span className="text-[10px] font-semibold">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 lg:ml-56 pt-14 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
      </main>
    </div>
  );
}
