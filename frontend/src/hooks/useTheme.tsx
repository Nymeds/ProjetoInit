import { useTheme as useThemeContext } from "../context/ThemeContext";

type Theme = "light" | "dark";

interface UseThemeReturn {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  isLight: boolean;
}

export function useTheme(): UseThemeReturn {
  const { isDark, setDark, toggleTheme } = useThemeContext();

  // Adaptador para manter compatibilidade sem duplicar estado de tema.
  const theme: Theme = isDark ? "dark" : "light";

  function setTheme(nextTheme: Theme) {
    setDark(nextTheme === "dark");
  }

  return {
    theme,
    toggleTheme,
    setTheme,
    isDark,
    isLight: !isDark,
  };
}

export default useTheme;
