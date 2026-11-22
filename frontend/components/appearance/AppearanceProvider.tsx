"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, DEFAULT_APPEARANCE, STORAGE_KEY, applyAppearance, sanitize } from "./palettes";

interface Ctx {
  appearance: Appearance;
  setAppearance: (next: Partial<Appearance>) => void;
  reset: () => void;
  sheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
}

const AppearanceCtx = createContext<Ctx | null>(null);

function read(): Appearance {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return sanitize(JSON.parse(raw));
    // migrate the earlier light/dark toggle
    const legacy = localStorage.getItem("shqml-theme");
    if (legacy === "dark") return { ...DEFAULT_APPEARANCE, mode: "night" };
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_APPEARANCE;
}

export const AppearanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appearance, setState] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Hydrate from storage (the pre-paint script has already applied it to <html>).
  useEffect(() => {
    setState(read());
  }, []);

  const commit = useCallback((a: Appearance) => {
    // Briefly animate colour changes across the page when the user switches palette or mode.
    const root = document.documentElement;
    root.classList.add("appearance-transition");
    window.setTimeout(() => root.classList.remove("appearance-transition"), 450);
    applyAppearance(a);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
    } catch {
      /* ignore */
    }
  }, []);

  const setAppearance = useCallback(
    (next: Partial<Appearance>) => {
      setState((prev) => {
        const a = sanitize({ ...prev, ...next });
        commit(a);
        return a;
      });
    },
    [commit]
  );

  const reset = useCallback(() => {
    setState(DEFAULT_APPEARANCE);
    commit(DEFAULT_APPEARANCE);
  }, [commit]);

  const value = useMemo(
    () => ({ appearance, setAppearance, reset, sheetOpen, openSheet: () => setSheetOpen(true), closeSheet: () => setSheetOpen(false) }),
    [appearance, setAppearance, reset, sheetOpen]
  );
  return <AppearanceCtx.Provider value={value}>{children}</AppearanceCtx.Provider>;
};

export function useAppearance(): Ctx {
  const ctx = useContext(AppearanceCtx);
  if (!ctx) throw new Error("useAppearance must be used inside <AppearanceProvider>");
  return ctx;
}
