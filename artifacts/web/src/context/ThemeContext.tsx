import { createContext, useContext, useEffect, type ReactNode } from "react";

/**
 * The app is light-only (Oman Debates brand identity).
 * The context is kept so existing consumers keep compiling, but the mode is fixed.
 */
type ThemeMode = "light";

interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: false;
}

const VALUE: ThemeContextType = {
  themeMode: "light",
  setThemeMode: () => {},
  isDark: false,
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Make sure no previously stored preference can bring the dark theme back.
    document.documentElement.classList.remove("dark");
    localStorage.removeItem("theme_mode");
  }, []);

  return <ThemeContext.Provider value={VALUE}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
