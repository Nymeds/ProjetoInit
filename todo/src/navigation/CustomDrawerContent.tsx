import React from "react";
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
  type DrawerContentComponentProps,
  type DrawerNavigationProp,
} from "@react-navigation/drawer";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useThemeContext } from "../context/ThemeContext";
import type { MainDrawerParamList } from "./AppDrawer";

type CustomDrawerProps = DrawerContentComponentProps;

export default function CustomDrawerContent(props: CustomDrawerProps) {
  const { logout } = useAuth();
  const { toggleTheme, isDark } = useThemeContext();
  const navigation = props.navigation as unknown as DrawerNavigationProp<MainDrawerParamList>;

  const onLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
      alert("Erro ao deslogar");
    }
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ flex: 1, paddingTop: 0 }}>
      <DrawerItemList {...props} />

      <DrawerItem
        label="Grupos"
        onPress={() => navigation.navigate("GroupsStack")}
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
