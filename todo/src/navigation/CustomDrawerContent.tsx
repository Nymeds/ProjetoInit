import React from "react";
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
  type DrawerNavigationProp,
} from "@react-navigation/drawer";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { useThemeContext } from "../context/ThemeContext";
import type { MainDrawerParamList } from "./AppDrawer";

// Aceita qualquer props do drawer (workaround para mismatch de typings)
export default function CustomDrawerContent(props: any) {
  const { colors } = useTheme();
  const { logout } = useAuth();
  const { toggleTheme, isDark } = useThemeContext();

  // cast local para usar navegação tipada
  const navigation = (props.navigation as unknown) as DrawerNavigationProp<MainDrawerParamList>;

  const onLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
      alert("Erro ao deslogar");
    }
  };

  const goToGroups = () => {
    navigation.navigate("GroupsStack");
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1, paddingTop: 0 }}>
      <DrawerItemList {...props} />

      <DrawerItem
        label="Grupos"
        onPress={goToGroups}
        icon={({ color, size }) => <MaterialCommunityIcons name="account-group" color={color} size={size} />}
      />

      <DrawerItem
        label={isDark ? "Tema Claro" : "Tema Escuro"}
        onPress={toggleTheme}
        icon={({ color, size }) => <MaterialCommunityIcons name="theme-light-dark" color={color} size={size} />}
      />

      <DrawerItem
        label="Sair"
        onPress={onLogout}
        icon={({ color, size }) => <MaterialCommunityIcons name="logout" color={color} size={size} />}
      />
    </DrawerContentScrollView>
  );
}
