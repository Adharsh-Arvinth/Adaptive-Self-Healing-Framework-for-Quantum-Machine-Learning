"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ToastMessage } from "@/types";

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

// Friendly humanizer for cryptic backend error codes
function humanizeToastMessage(title: string, rawMessage: any): {
  cleanTitle: string;
  cleanSummary: string;
  technicalDetail?: string;
} {
  let text = "";
  if (typeof rawMessage === "string") {
    text = rawMessage;
  } else if (Array.isArray(rawMessage)) {
    text = rawMessage
      .map((item) => (typeof item === "string" ? item : item?.msg || JSON.stringify(item)))
      .join("; ");
  } else if (typeof rawMessage === "object" && rawMessage !== null) {
    text = rawMessage.msg || rawMessage.detail || rawMessage.message || JSON.stringify(rawMessage);
  } else {
    text = String(rawMessage || "");
  }

  // Handle specific known backend conditions
  if (text.includes("NO_OP_MUTATION") && text.includes("noise mitigation")) {
    return {
      cleanTitle: "Noise Mitigation Already Active",
      cleanSummary: "The current model already has this correction enabled. No additional change was applied.",
      technicalDetail: text,
    };
  }

  if (text.includes("minimum limit") || text.includes("L_min") || text.includes("depth")) {
    return {
      cleanTitle: "Minimum Depth Bound Active",
      cleanSummary: "Ansatz depth cannot be reduced below L_min = 2 to preserve quantum Hilbert state expressibility.",
      technicalDetail: text,
    };
  }

  if (text.includes("anti-oscillation") || text.includes("W_osc")) {
    return {
      cleanTitle: "Anti-Oscillation Guard Intervened",
      cleanSummary: "Rapid cyclic intervention blocked by the 4-step safety cooldown window.",
      technicalDetail: text,
    };
  }

  if (text.includes("Validation window active") || text.includes("W_val")) {
    return {
      cleanTitle: "Validation Window Active",
      cleanSummary: "A candidate repair is currently undergoing evaluation across W_val = 3 steps before commit.",
      technicalDetail: text,
    };
  }

  // Default clean output
  const cleanTitle = title || "System Notification";
  return {
    cleanTitle,
    cleanSummary: text,
    technicalDetail: text.length > 90 ? text : undefined,
  };
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <aside
      aria-live="polite"
      aria-atomic="true"
      className="fixed top-16 sm:top-20 inset-x-3 sm:inset-x-auto sm:right-6 z-[100] flex flex-col gap-2.5 max-w-full sm:w-[420px] pointer-events-none"
    >
      {toasts.map((toast) => {
        const { cleanTitle, cleanSummary, technicalDetail } = humanizeToastMessage(
          toast.title,
          toast.message
        );

        return (
          <ToastCard
            key={toast.id}
            toast={toast}
            cleanTitle={cleanTitle}
            cleanSummary={cleanSummary}
            technicalDetail={technicalDetail}
            onDismiss={() => onDismiss(toast.id)}
          />
        );
      })}
    </aside>
  );
};

const ToastCard: React.FC<{
  toast: ToastMessage;
  cleanTitle: string;
  cleanSummary: string;
  technicalDetail?: string;
  onDismiss: () => void;
}> = ({ toast, cleanTitle, cleanSummary, technicalDetail, onDismiss }) => {
  const [showTechnical, setShowTechnical] = useState(false);

  const getTheme = () => {
    switch (toast.type) {
      case "success":
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />,
          border: "border-emerald-500/30",
          glow: "shadow-[0_8px_32px_rgba(16,185,129,0.15)]",
          badgeBg: "bg-emerald-500/10 text-emerald-300",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
          border: "border-amber-500/30",
          glow: "shadow-[0_8px_32px_rgba(245,158,11,0.15)]",
          badgeBg: "bg-amber-500/10 text-amber-300",
        };
      case "error":
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />,
          border: "border-rose-500/30",
          glow: "shadow-[0_8px_32px_rgba(244,63,94,0.18)]",
          badgeBg: "bg-rose-500/10 text-rose-300",
        };
      default:
        return {
          icon: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
          border: "border-sky-500/30",
          glow: "shadow-[0_8px_32px_rgba(14,165,233,0.15)]",
          badgeBg: "bg-sky-500/10 text-sky-300",
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      role="status"
      className={`pointer-events-auto flex flex-col p-4 rounded-2xl backdrop-blur-2xl bg-slate-950/95 text-slate-100 border ${theme.border} ${theme.glow} transition-all duration-300 animate-slide-down max-w-full`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{theme.icon}</div>
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-semibold text-white tracking-tight font-sans">
              {cleanTitle}
            </h4>
          </div>
          <p className="text-[12px] text-slate-300 mt-1 leading-relaxed font-sans">
            {cleanSummary}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {technicalDetail && (
        <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px]">
          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors font-mono"
          >
            <span>{showTechnical ? "Hide technical diagnostic" : "View technical diagnostic"}</span>
            {showTechnical ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showTechnical && (
            <pre className="mt-1.5 p-2 rounded-lg bg-black/60 border border-white/5 font-mono text-slate-300 whitespace-pre-wrap break-all max-h-28 overflow-y-auto">
              {technicalDetail}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};
