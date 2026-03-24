import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Building2,
  User,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { useLogin } from "../hook/useLogin";

const ROL_STYLES = {
  0: {
    bg: "bg-orange-50",
    blob1: "bg-amber-200",
    blob2: "bg-yellow-100",
    ring: "bg-amber-100",
    icon: "text-amber-500",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-700",
    divFrom: "#92400e",
    divTo: "#f59e0b",
    btnBg: "bg-amber-500 hover:bg-amber-600",
    focusBorder: "focus:border-amber-400",
    backHover: "hover:text-amber-600",
  },
  1: {
    bg: "bg-teal-50",
    blob1: "bg-teal-200",
    blob2: "bg-emerald-100",
    ring: "bg-teal-100",
    icon: "text-teal-500",
    badgeBg: "bg-teal-50",
    badgeText: "text-teal-700",
    divFrom: "#134e4a",
    divTo: "#14b8a6",
    btnBg: "bg-teal-600 hover:bg-teal-700",
    focusBorder: "focus:border-teal-400",
    backHover: "hover:text-teal-600",
  },
  2: {
    bg: "bg-rose-50",
    blob1: "bg-rose-200",
    blob2: "bg-pink-100",
    ring: "bg-rose-100",
    icon: "text-rose-400",
    badgeBg: "bg-rose-50",
    badgeText: "text-rose-600",
    divFrom: "#881337",
    divTo: "#fb7185",
    btnBg: "bg-rose-500 hover:bg-rose-600",
    focusBorder: "focus:border-rose-300",
    backHover: "hover:text-rose-500",
  },
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const rolSeleccionado = location.state?.rol ?? null;

  const [form, setForm] = useState({ username: "", password: "" });
  const [showPass, setShowPass] = useState(false);

  const { loading, error, login } = useLogin();

  if (!rolSeleccionado) {
    navigate("../role", { replace: true });
    return null;
  }

  const s = ROL_STYLES[rolSeleccionado.value] ?? ROL_STYLES[0];

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { user } = await login(form);

      // Redirigir según rol: 0 tesorero | 1 profesora | 2 padre
      const rutas = { 0: "../dashboard", 1: "../profesora", 2: "../padre" };
      navigate(rutas[user.role] ?? "../dashboard");
    } catch {
      // El error ya lo maneja el hook en su estado `error`
    }
  };

  return (
    <div
      className={`min-h-screen ${s.bg} flex items-center justify-center px-4 py-10 relative overflow-hidden`}
    >
      {/* Blobs */}
      <div
        className={`absolute -top-32 -left-20 w-80 h-80 rounded-full ${s.blob1} opacity-30 pointer-events-none`}
      />
      <div
        className={`absolute -bottom-24 -right-16 w-72 h-72 rounded-full ${s.blob2} opacity-40 pointer-events-none`}
      />

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-100 p-7 relative z-10">
        {/* Volver */}
        <button
          onClick={() => navigate("../role")}
          className={`flex items-center gap-1.5 text-stone-400 text-sm font-semibold mb-6 transition-colors ${s.backHover}`}
        >
          <ChevronLeft size={15} strokeWidth={2.5} />
          Cambiar perfil
        </button>

        {/* Cabecera */}
        <div className="text-center mb-5">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${s.ring} mb-3`}
          >
            <Building2 className={s.icon} size={30} strokeWidth={1.7} />
          </div>
          <h1 className="text-xl font-black text-stone-800 tracking-widest uppercase">
            Tesorería
          </h1>
          <span
            className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-bold ${s.badgeBg} ${s.badgeText}`}
          >
            {rolSeleccionado.label}
          </span>
        </div>

        {/* Divisor */}
        <div
          className="h-[2px] rounded-full mb-6"
          style={{
            background: `linear-gradient(90deg, ${s.divFrom} 0%, ${s.divTo} 100%)`,
          }}
        />

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-600 tracking-wide">
              Usuario
            </label>
            <div className="relative flex items-center">
              <User
                size={16}
                className="absolute left-3 text-stone-400 pointer-events-none"
              />
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                placeholder="PAD-0001"
                autoComplete="username"
                className={`w-full h-11 pl-9 pr-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 font-medium outline-none transition-colors ${s.focusBorder} focus:bg-white`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-600 tracking-wide">
              Contraseña
            </label>
            <div className="relative flex items-center">
              <Lock
                size={16}
                className="absolute left-3 text-stone-400 pointer-events-none"
              />
              <input
                name="password"
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                className={`w-full h-11 pl-9 pr-10 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-700 font-medium outline-none transition-colors ${s.focusBorder} focus:bg-white`}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 text-stone-400 hover:text-stone-600 transition-colors"
                tabIndex={-1}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error del hook */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="text-red-400 shrink-0" />
              <span className="text-xs font-semibold text-red-500">
                {error}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`mt-1 h-11 rounded-xl text-white text-sm font-bold tracking-wide flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 ${s.btnBg}`}
          >
            {loading ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              "Ingresar"
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-stone-100" />
          <span className="text-[10px] text-stone-300 font-medium">
            TURCO · Sistema de Tesorería
          </span>
          <div className="flex-1 h-px bg-stone-100" />
        </div>

        <p className="text-center text-[11px] text-stone-400 leading-relaxed">
          ¿Olvidaste tu contraseña? Comunícate
          <br />
          con el tesorero del aula.
        </p>
      </div>
    </div>
  );
}
