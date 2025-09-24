import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AuthProvider } from "./src/context/AuthContext";
import { ThemeProvider, useThemeContext } from "./src/context/ThemeContext";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationWithTheme />
      </ThemeProvider>
    </AuthProvider>
  );
}

function NavigationWithTheme() {
  const { theme } = useThemeContext();

  return (
    <NavigationContainer theme={theme}>
      <RootNavigator />
    </NavigationContainer>
  );
}
