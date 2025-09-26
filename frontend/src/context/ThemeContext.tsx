/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeContextValue = {
  isDark: boolean;
  setDark: (value: boolean) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = "theme"; // 'dark' | 'light'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "dark") return true;
      if (saved === "light") return false;
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem(STORAGE_KEY, isDark ? "dark" : "light");
    } catch { /* empty */ }
  }, [isDark]);

  useEffect(() => {
    // se usuário não tiver preferência salva, sincroniza com mudança do sistema
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved && window.matchMedia) {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
        mq.addEventListener ? mq.addEventListener("change", handler) : mq.addListener(handler as any);
        return () => {
          mq.removeEventListener ? mq.removeEventListener("change", handler) : mq.removeListener(handler as any);
        };
      }
    } catch { /* empty */ }
  }, []);

  const setDark = (v: boolean) => setIsDark(v);
  const toggleTheme = () => setIsDark((s) => !s);

  return <ThemeContext.Provider value={{ isDark, setDark, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}