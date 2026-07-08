import { Clock, Check, X, FileText, ShieldOff } from "lucide-react";

// Config visual de estados de evento_padres
// 0=pendiente 1=presente 2=ausente 3=justificado 4=exonerado
export const ESTADO_CONFIG = {
  0: { label: "Pendiente",   icon: Clock,     color: "text-stone-400",   bg: "bg-stone-50",   border: "border-stone-200"   },
  1: { label: "Presente",    icon: Check,     color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" },
  2: { label: "Ausente",     icon: X,         color: "text-red-400",     bg: "bg-red-50",     border: "border-red-200"     },
  3: { label: "Justificado", icon: FileText,  color: "text-purple-400",  bg: "bg-purple-50",  border: "border-purple-200"  },
  4: { label: "Exonerado",   icon: ShieldOff, color: "text-amber-400",   bg: "bg-amber-50",   border: "border-amber-200"   },
};
