"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { ToastMessage } from "@/types";

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const getIcon = () => {
          switch (toast.type) {
            case "success":
              return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
            case "warning":
              return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
            case "error":
              return <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />;
            default:
              return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
          }
        };

        const getBorderColor = () => {
          switch (toast.type) {
            case "success":
              return "border-emerald-500/20";
            case "warning":
              return "border-amber-500/20";
            case "error":
              return "border-rose-500/20";
            default:
              return "border-blue-500/20";
          }
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-apple bg-bg-surface border ${getBorderColor()} shadow-apple-lg animate-slide-down transition-all`}
          >
            <div className="mt-0.5">{getIcon()}</div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-content-primary tracking-tight">
                {toast.title}
              </h4>
              <p className="text-[11px] text-content-secondary mt-0.5 leading-relaxed break-words">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-content-tertiary hover:text-content-primary p-0.5 rounded transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
