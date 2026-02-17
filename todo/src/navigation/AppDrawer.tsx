import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import type { NavigatorScreenParams } from "@react-navigation/native";
import CustomDrawerContent from "./CustomDrawerContent";
import HomeStack, { type HomeStackParamList } from "./HomeStack";
import GroupsStack, { type GroupsStackParamList } from "./GroupStack";

export type MainDrawerParamList = {
  HomeStack: NavigatorScreenParams<HomeStackParamList> | undefined;
  GroupsStack: NavigatorScreenParams<GroupsStackParamList> | undefined;
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
