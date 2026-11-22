"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { RotateCcw, X } from "lucide-react";
import { Btn } from "./ui/kit";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Centred confirmation dialog (modals stay centred; scale from 0.96, never from 0). */
export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Reset",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}) => {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onCancel]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[96] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
          <motion.div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onCancel} />
          <motion.div
            className="relative w-full max-w-md rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] p-7 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.6)]"
            initial={{ opacity: 0, scale: reduce ? 1 : 0.96, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: reduce ? 1 : 0.97 }}
            transition={{ type: "spring", bounce: 0, duration: 0.35 }}
          >
            <button onClick={onCancel} className="apple-btn absolute right-4 top-4 w-9 h-9 rounded-full flex items-center justify-center text-[var(--content-tertiary)] hover:text-[var(--content-primary)] hover:bg-[var(--bg-subtle)]" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
            <div className="type-label text-[var(--status-danger)]">Please confirm</div>
            <h3 id="confirm-title" className="lab-title mt-2 text-[var(--content-primary)]">{title}</h3>
            <p className="text-[0.95rem] text-[var(--content-secondary)] mt-3 leading-relaxed">{message}</p>
            <div className="flex flex-wrap justify-end gap-2 mt-7">
              <Btn variant="secondary" onClick={onCancel}>{cancelLabel}</Btn>
              <Btn variant="danger" onClick={onConfirm} icon={<RotateCcw className="w-4 h-4" />} autoFocus>
                {confirmLabel}
              </Btn>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ConfirmationModal;
