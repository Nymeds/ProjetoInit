import React from "react";
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from "@react-navigation/drawer";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "@react-navigation/native"; 
import { useAuth } from "../context/AuthContext";
import { useThemeContext } from "../context/ThemeContext"; 

export default function CustomDrawerContent(props: any) {
  const { colors } = useTheme();
  const { logout } = useAuth();
  const { toggleTheme, isDark } = useThemeContext(); 

  const onLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error(err);
      alert("Erro ao deslogar");
    }
  };

  const goToGroups = () => {
    props.navigation.navigate("GroupsStack", { screen: "Groups" });
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
