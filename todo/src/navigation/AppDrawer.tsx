import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import HomeStack from "./HomeStack";
import GroupStack from "./GroupStack";
import CustomDrawerContent from "./CustomDrawerContent";

export type MainDrawerParamList = {
  HomeStack: undefined;
  GroupsStack: undefined;
};

const Drawer = createDrawerNavigator<MainDrawerParamList>();

export default function AppDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="HomeStack" component={HomeStack} options={{ title: "Início" }} />
      <Drawer.Screen name="GroupsStack" component={GroupStack} options={{ title: "Grupos" }} />
    </Drawer.Navigator>
  );
}
