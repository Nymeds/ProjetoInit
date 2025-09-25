import React from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { Menu, LogOut } from "lucide-react-native"
import { useTheme, useNavigation } from "@react-navigation/native"
import { DrawerNavigationProp } from "@react-navigation/drawer"
import type { MainDrawerParamList } from "../navigation/AppDrawer"



export default function DashboardHeader() {
  const { colors } = useTheme();

 
  const navigation = useNavigation<DrawerNavigationProp<MainDrawerParamList>>();

  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.iconButton}>
        <Menu size={28} color={colors.primary} />
      </TouchableOpacity>

      <Text style={[styles.headerText, { color: colors.text }]}>Suas Tarefas</Text>


    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  iconButton: {
    padding: 4,
  },
});
