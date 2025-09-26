import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import CustomDrawerContent from "./CustomDrawerContent";
import HomeStack, { HomeStackParamList } from "./HomeStack";
import GroupsStack, { GroupsStackParamList } from "./GroupStack";

export type MainDrawerParamList = {
  HomeStack: undefined;
  GroupsStack: undefined;
};

const Drawer = createDrawerNavigator<MainDrawerParamList>();

export default function AppDrawer() {
  return (
    <Drawer.Navigator
      id={undefined}
      initialRouteName="HomeStack"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="HomeStack" component={HomeStack} options={{ title: "Home" }} />
      <Drawer.Screen name="GroupsStack" component={GroupsStack} options={{ title: "Grupos" }} />
    </Drawer.Navigator>
  );
}
