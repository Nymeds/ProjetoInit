import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { Menu, LogOut } from "lucide-react-native";
import { useTheme } from "@react-navigation/native";
import { MainDrawerParamList } from "../navigation/AppDrawer";

type Props = {
  drawerNav: DrawerNavigationProp<MainDrawerParamList> | undefined;
  logout: () => Promise<void>;
};

export default function Header({ drawerNav, logout }: Props) {
  const { colors } = useTheme();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => drawerNav?.openDrawer()}>
        <Menu size={28} color={colors.primary} />
      </TouchableOpacity>
      <Text style={[styles.headerText, { color: colors.text }]}>Suas Tarefas</Text>
      <TouchableOpacity onPress={handleLogout}>
        <LogOut size={28} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerText: { fontSize: 20, fontWeight: "bold" },
});
