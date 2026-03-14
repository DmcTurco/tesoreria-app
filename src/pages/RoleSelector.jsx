import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Users, User } from "lucide-react";

const ROLES = [
  {
    value: 0,
    label: "Tesorero",
    sub: "Administración y finanzas",
    icon: Wallet,
  },
  { value: 1, label: "Profesora", sub: "Gestión de asistencia", icon: Users },
  { value: 2, label: "Padre / Madre", sub: "Consulta mi estado", icon: User },
];

// Colores fijos por índice — Tailwind los detecta en build time
const CARD_STYLES = [
  {
    wrapper: "hover:border-amber-400 hover:shadow-amber-100",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    badge: "bg-amber-50 text-amber-600",
    dot: "bg-amber-400",
    // para navigate state
    logoBg: "#78350f",
    iconHex: "#d97706",
    badgeBg: "rgba(251,191,36,0.12)",
    badgeColor: "#92400e",
    dividerTo: "#f59e0b",
    btnBg: "#92400e",
  },
  {
    wrapper: "hover:border-teal-400 hover:shadow-teal-100",
    iconBg: "bg-teal-50",
    iconColor: "text-teal-500",
    badge: "bg-teal-50 text-teal-600",
    dot: "bg-teal-400",
    logoBg: "#134e4a",
    iconHex: "#0d9488",
    badgeBg: "rgba(20,184,166,0.10)",
    badgeColor: "#0f766e",
    dividerTo: "#14b8a6",
    btnBg: "#0f766e",
  },
  {
    wrapper: "hover:border-rose-300 hover:shadow-rose-100",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-400",
    badge: "bg-rose-50 text-rose-500",
    dot: "bg-rose-300",
    logoBg: "#881337",
    iconHex: "#fb7185",
    badgeBg: "rgba(251,113,133,0.10)",
    badgeColor: "#be123c",
    dividerTo: "#fb7185",
    btnBg: "#be123c",
  },
];

const RoleSelector = () => {
  const [hovered, setHovered] = useState(null);
  const navigate = useNavigate();

  const handleSelect = (rol, styles) => {
    const { icon: _icon, ...rolData } = rol;
    navigate("../login", {
      state: {
        rol: {
          ...rolData,
          logoBg: styles.logoBg,
          iconColor: styles.iconHex,
          badgeBg: styles.badgeBg,
          badgeColor: styles.badgeColor,
          dividerTo: styles.dividerTo,
          btnBg: styles.btnBg,
        },
      },
    });
  };

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Fondos decorativos fijos */}
      <div className="absolute -top-32 -left-20 w-80 h-80 rounded-full bg-amber-200 opacity-30 pointer-events-none" />
      <div className="absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-rose-200 opacity-25 pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 w-48 h-48 rounded-full bg-teal-100 opacity-40 pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Cabecera */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500 shadow-lg shadow-amber-200 mb-4">
            <svg
              width="38"
              height="38"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>

          <h1 className="text-2xl font-black text-stone-800 tracking-widest uppercase">
            Tesorería
          </h1>
          <p className="text-xs text-stone-400 font-medium mt-1">
            I.E. Nº — Sistema APAFA
          </p>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-stone-200" />
            <span className="text-xs text-stone-400 font-semibold">
              Selecciona tu perfil
            </span>
            <div className="flex-1 h-px bg-stone-200" />
          </div>
        </div>

        {/* Tarjetas */}
        <div className="flex flex-col gap-3">
          {ROLES.map((rol, i) => {
            const Icon = rol.icon;
            const s = CARD_STYLES[i];
            const isHov = hovered === rol.value;
            return (
              <button
                key={rol.value}
                className={`
                  w-full flex items-center gap-4 text-left
                  bg-white border-2 border-stone-100 rounded-2xl p-4
                  cursor-pointer transition-all duration-200
                  shadow-sm hover:shadow-md
                  ${s.wrapper}
                  ${isHov ? "-translate-y-0.5" : ""}
                `}
                onMouseEnter={() => setHovered(rol.value)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleSelect(rol, s)}
              >
                {/* Ícono */}
                <div
                  className={`w-12 h-12 rounded-xl ${s.iconBg} flex items-center justify-center shrink-0`}
                >
                  <Icon className={s.iconColor} size={24} strokeWidth={1.8} />
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-700 leading-tight">
                    {rol.label}
                  </p>
                  <p className="text-xs text-stone-400 mt-0.5">{rol.sub}</p>
                </div>

                {/* Badge + flecha */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${s.badge}`}
                  >
                    Ingresar
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full ${s.iconBg} flex items-center justify-center transition-transform duration-200 ${isHov ? "translate-x-0.5" : ""}`}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={s.iconColor}
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-stone-300 font-medium mt-8">
          Versión 1.0 · {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};
export default RoleSelector;