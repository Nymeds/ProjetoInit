import React, { createContext, useContext, useState, ReactNode } from "react";
import { Theme } from "@react-navigation/native";
import { lightColors, darkColors } from "../theme/colors";

type ThemeContextType = {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false);
  const toggleTheme = () => setIsDark(prev => !prev);

  const theme: Theme = {
    dark: isDark,
    colors: isDark ? darkColors : lightColors,
    fonts: {
      regular: {
        fontFamily: "",
        fontWeight: "bold"
      },
      medium: {
        fontFamily: "",
        fontWeight: "bold"
      },
      bold: {
        fontFamily: "",
        fontWeight: "bold"
      },
      heavy: {
        fontFamily: "",
        fontWeight: "bold"
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
