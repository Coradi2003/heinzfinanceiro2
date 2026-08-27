"use client";

import { useEffect } from "react";
import { useConfigStore } from "@/store/useConfigStore";

function classToHex(cls?: string): string {
  if (!cls) return "#C9797F";
  const m = cls.match(/^bg-\[#([0-9A-Fa-f]{6})\]$/);
  if (m) return `#${m[1]}`;
  return "#C9797F";
}

function normalizeHex(hex?: string): string {
  if (!hex || !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)) return "#FFF7F7";
  if (hex.length === 4) {
    const h = hex.slice(1);
    return `#${h.split("").map(c => c + c).join("")}`;
  }
  return hex;
}

function darken(hex: string, percent = 0.15): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.round((n >> 16) * (1 - percent)));
  const g = Math.max(0, Math.round(((n >> 8) & 0xff) * (1 - percent)));
  const b = Math.max(0, Math.round((n & 0xff) * (1 - percent)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function isDark(hex: string): boolean {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
}

export function ThemeApplier() {
  const corHexa = useConfigStore(s => s.corHexa);
  const bgHexa = useConfigStore(s => s.bgHexa);

  useEffect(() => {
    const root = document.documentElement;
    const primary = classToHex(corHexa);
    const background = normalizeHex(bgHexa);

    root.style.setProperty("--app-primary", primary);
    root.style.setProperty("--app-primary-dark", darken(primary));
    root.style.setProperty("--app-background", background);

    if (isDark(background)) root.classList.add("dark-theme");
    else root.classList.remove("dark-theme");
  }, [corHexa, bgHexa]);

  return null;
}
