import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Groups from "../screens/GroupsScreen/GroupsScreen";
import GroupDetail from "../screens/GroupsScreen/GroupDetailScreen";

const Stack = createNativeStackNavigator();

export default function GroupStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Groups" component={Groups} />
      <Stack.Screen name="GroupDetail" component={GroupDetail} />
    </Stack.Navigator>
  );
}