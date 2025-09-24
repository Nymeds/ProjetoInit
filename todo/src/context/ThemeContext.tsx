import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
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

 
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem("@theme");
        if (storedTheme !== null) {
          setIsDark(storedTheme === "dark");
        }
      } catch (error) {
        console.error("Erro ao carregar tema:", error);
      }
    };
    loadTheme();
  }, []);


  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem("@theme", newTheme ? "dark" : "light");
    } catch (error) {
      console.error("Erro ao salvar tema:", error);
    }
  };

  const theme: Theme = {
    dark: isDark,
    colors: isDark ? darkColors : lightColors,
    fonts: {
      regular: { fontFamily: "", fontWeight: "bold" },
      medium: { fontFamily: "", fontWeight: "bold" },
      bold: { fontFamily: "", fontWeight: "bold" },
      heavy: { fontFamily: "", fontWeight: "bold" }
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
