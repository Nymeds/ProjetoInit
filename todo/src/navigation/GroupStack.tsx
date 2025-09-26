import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GroupsScreen from "../screens/GroupsScreen/GroupsScreen";
import GroupDetailScreen from "../screens/GroupsScreen/GroupDetailScreen";

export type GroupsStackParamList = {
  Groups: undefined;
  GroupDetail: { id: string };
};

const Stack = createNativeStackNavigator<GroupsStackParamList>();

export default function GroupsStack() {
  return (
    <Stack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Groups" component={GroupsScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
    </Stack.Navigator>
  );
}