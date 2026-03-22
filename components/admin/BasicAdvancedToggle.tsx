"use client";

import { useEffect, useState } from "react";

export type DashboardMode = "basico" | "avanzado";
export const DASHBOARD_MODE_STORAGE_KEY = "iv_admin_dashboard_mode";
export const DASHBOARD_MODE_EVENT = "iv-dashboard-mode";

function readMode(): DashboardMode {
  if (typeof window === "undefined") return "basico";
  const saved = window.localStorage.getItem(DASHBOARD_MODE_STORAGE_KEY);
  return saved === "avanzado" ? "avanzado" : "basico";
}

export function BasicAdvancedToggle({
  value,
  onChange,
}: {
  value?: DashboardMode;
  onChange?: (value: DashboardMode) => void;
}) {
  const [mode, setMode] = useState<DashboardMode>(value ?? "basico");

  useEffect(() => {
    if (value) {
      setMode(value);
      return;
    }
    setMode(readMode());
  }, [value]);

  function apply(next: DashboardMode) {
    setMode(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(DASHBOARD_MODE_STORAGE_KEY, next);
      window.dispatchEvent(new CustomEvent(DASHBOARD_MODE_EVENT, { detail: next }));
    }
    onChange?.(next);
  }

  return (
    <div className="inline-flex overflow-hidden rounded-md border border-white/15">
      <button
        type="button"
        onClick={() => apply("basico")}
        className={`px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition-colors ${
          mode === "basico"
            ? "bg-white/10 text-white"
            : "bg-transparent text-neutral-400 hover:bg-white/5"
        }`}
      >
        Modo básico
      </button>
      <button
        type="button"
        onClick={() => apply("avanzado")}
        className={`border-l border-white/15 px-3 py-1.5 text-xs uppercase tracking-[0.12em] transition-colors ${
          mode === "avanzado"
            ? "bg-white/10 text-white"
            : "bg-transparent text-neutral-400 hover:bg-white/5"
        }`}
      >
        Modo avanzado
      </button>
    </div>
  );
}
